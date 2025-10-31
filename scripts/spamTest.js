/* eslint-disable */
// Robust multi-mode spam/stress tester for local anti-bot endpoints
// Configuration is hard-coded by design for local testing (no environment variables).
// Edit the constants below to change behavior.

const NEXT_PUBLIC_BASE_URL = "http://localhost:3000"; // base URL of your running app
const TARGET_PATH = "/api/contact"; // endpoint to target
const totalRequests = 10000; // total requests to send
const concurrency = 4; // concurrent requests
const difficulty = 6; // PoW difficulty (lower -> faster)
const maxAttempts = 10000000; // max nonce attempts per PoW solver
const os = require("os");
const cpuCount = os.cpus ? os.cpus().length : 2;
const workerCount = Math.max(1, Math.min(cpuCount, 4));

const url = NEXT_PUBLIC_BASE_URL.replace(/\/$/, "") + TARGET_PATH;

// Prefer the installed node-fetch package for Node.js
const fetchFn = require("node-fetch");

const crypto = require("crypto");
const { Worker } = (() => {
    try {
        return require("worker_threads");
    } catch {
        return {};
    }
})();

function sha256HexNode(input) {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Multi-threaded PoW solver using worker_threads when available.
 * Falls back to single-threaded loop in the main thread.
 * Returns { nonce, hash, ts } or null on failure.
 */
async function computePoWNode({
    difficulty,
    challenge = "renardis-v1",
    ts = Date.now(),
    maxAttempts = 5_000_000,
    workers = 1,
}) {
    const targetPrefix = "0".repeat(difficulty);

    // If worker_threads are available and workers > 1, spawn workers
    if (Worker && workers > 1) {
        return new Promise((resolve) => {
            let resolved = false;
            const workersList = [];
            const onMessage = (w, msg) => {
                if (resolved) return;
                if (!msg) return;
                if (msg.type === "found") {
                    resolved = true;
                    for (const wk of workersList) {
                        try {
                            wk.terminate();
                        } catch (e) {}
                    }
                    resolve({ nonce: msg.nonce, hash: msg.hash, ts });
                }
            };

            for (let i = 0; i < workers; i++) {
                const workerScript = `
                    const { parentPort, workerData } = require('worker_threads');
                    const crypto = require('crypto');
                    const difficulty = workerData.difficulty;
                    const challenge = workerData.challenge;
                    const ts = workerData.ts;
                    const maxAttempts = workerData.maxAttempts;
                    const start = workerData.start;
                    const step = workerData.step;
                    const target = '0'.repeat(difficulty);

                    (async () => {
                        try {
                            for (let i = start; i < maxAttempts; i += step) {
                                const nonce = String(i);
                                const input = nonce + ':' + ts + ':' + challenge;
                                const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
                                if (hash.startsWith(target)) {
                                    parentPort.postMessage({ type: 'found', nonce, hash });
                                    return;
                                }
                                if ((i - start) % 10000 === 0) {
                                    await new Promise(r => setTimeout(r, 0));
                                }
                            }
                            parentPort.postMessage({ type: 'done' });
                        } catch (err) {
                            parentPort.postMessage({ type: 'error', error: String(err) });
                        }
                    })();
                `;
                const wk = new Worker(workerScript, {
                    eval: true,
                    workerData: {
                        difficulty,
                        challenge,
                        ts,
                        maxAttempts,
                        start: i,
                        step: workers,
                    },
                });
                workersList.push(wk);
                wk.on("message", (msg) => onMessage(wk, msg));
                wk.on("error", () => {});
            }

            // fail-safe: if nothing after long time, resolve null
            const timeoutMs = 1000 * 60 * 5; // 5 minutes max per pow
            setTimeout(() => {
                if (!resolved) {
                    for (const wk of workersList) {
                        try {
                            wk.terminate();
                        } catch (e) {}
                    }
                    resolve(null);
                }
            }, timeoutMs);
        });
    }

    // Fallback single-thread
    for (let i = 0; i < maxAttempts; i++) {
        const nonce = String(i);
        const input = nonce + ":" + ts + ":" + challenge;
        const hash = sha256HexNode(input);
        if (hash.startsWith(targetPrefix)) {
            return { nonce, hash, ts };
        }
        if (i % 10000 === 0) {
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    return null;
}

/**
 * Send a single POST request with given payload.
 * Returns { status, text }.
 */
async function send(payload) {
    try {
        const res = await fetchFn(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const text = await res.text();
        return { status: res.status, text };
    } catch (err) {
        return { error: String(err) };
    }
}

/**
 * Build payload variants.
 */
async function buildPayload(mode, overrides = {}) {
    const base = {
        fullName: "Spam Bot",
        email: "spam@example.com",
        message: "automated test",
        _hp: "",
    };
    const ts = Date.now();
    if (mode === "honeypot") {
        base._hp = "I am a bot";
        return { ...base, ...overrides, ts, pow: null };
    }

    if (mode === "missingPow") {
        return { ...base, ...overrides, ts };
    }

    if (mode === "invalidPow") {
        const pow = { nonce: "0", hash: "deadbeef", ts };
        return { ...base, ...overrides, ts, pow: JSON.stringify(pow) };
    }

    // valid or rapid -> compute PoW
    const powResult = await computePoWNode({
        difficulty,
        challenge: "renardis-v1",
        ts,
        maxAttempts,
        workers: workerCount,
    });

    if (!powResult) {
        return {
            ...base,
            ...overrides,
            ts,
            pow: JSON.stringify({ nonce: "0", hash: "0" }),
        };
    }

    return { ...base, ...overrides, ts, pow: JSON.stringify(powResult) };
}

/**
 * Runner: sends requests with configured concurrency.
 */
async function run() {
    console.log("Target:", url);
    console.log(
        "Total requests:",
        totalRequests,
        "Concurrency:",
        concurrency,
        "Difficulty:",
        difficulty,
        "Workers:",
        workerCount
    );

    const modes = ["valid", "invalidPow", "missingPow", "honeypot", "rapid"];
    let sent = 0;
    let inFlight = 0;

    const results = [];
    async function next() {
        if (sent >= totalRequests) return;
        while (inFlight < concurrency && sent < totalRequests) {
            const idx = sent;
            sent++;
            inFlight++;
            (async (i) => {
                const mode = modes[i % modes.length];
                try {
                    const payload = await buildPayload(mode);
                    const res = await send(payload);
                    const summary = { i: i + 1, mode, result: res };
                    console.log(
                        `#${i + 1}`,
                        mode,
                        res.status ?? "-",
                        res.error
                            ? res.error
                            : res.text
                            ? res.text.slice(0, 120)
                            : ""
                    );
                    results.push(summary);
                } catch (err) {
                    console.error(`#${i + 1} error`, String(err));
                } finally {
                    inFlight--;
                    await next();
                }
            })(idx);
        }
    }

    await next();

    while (inFlight > 0) {
        await new Promise((r) => setTimeout(r, 200));
    }

    console.log("Done. Summary:");
    const summary = results.reduce((acc, r) => {
        const s = String(r.result.status || r.result.error || "err");
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    console.log(summary);
}

run().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
