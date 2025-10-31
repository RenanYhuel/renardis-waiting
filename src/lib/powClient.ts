export type PoWResult = {
    nonce: string;
    hash: string;
    ts: number;
};

type ComputeOpts = {
    difficulty: number;
    challenge: string;
    ts: number;
    onProgress?: (attempts: number) => void;
    maxAttempts?: number;
};

/**
 * Compute PoW using a Web Worker when available. Returns a promise and a cancel function.
 */
export function computePoW(opts: ComputeOpts): {
    promise: Promise<PoWResult | null>;
    cancel: () => void;
} {
    const {
        difficulty,
        challenge,
        ts,
        onProgress,
        maxAttempts = 5_000_000,
    } = opts;
    let cancelled = false;
    let worker: Worker | null = null;

    const promise = new Promise<PoWResult | null>(async (resolve) => {
        // If Worker is available, spawn one using a Blob URL
        if (typeof Worker !== "undefined") {
            const workerCode = `
        self.onmessage = async (e) => {
          const { difficulty, challenge, ts, maxAttempts } = e.data;
          const enc = new TextEncoder();
          let attempts = 0;
          let cancelled = false;
          self.onmessage = (m) => {
            if (m.data === 'cancel') cancelled = true;
          };
          try {
            while (attempts < maxAttempts && !cancelled) {
              const nonce = String(attempts);
              const data = enc.encode(nonce + ':' + ts + ':' + challenge);
              // crypto.subtle is available in modern workers
              const hashBuffer = await crypto.subtle.digest('SHA-256', data);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
              if (hashHex.startsWith('0'.repeat(difficulty))) {
                self.postMessage({ type: 'result', result: { nonce, hash: hashHex, ts } });
                return;
              }
              attempts++;
              if (attempts % 1000 === 0) {
                self.postMessage({ type: 'progress', attempts });
              }
            }
            if (cancelled) {
              self.postMessage({ type: 'cancelled' });
            } else {
              self.postMessage({ type: 'done' });
            }
          } catch (err) {
            self.postMessage({ type: 'error', error: String(err) });
          }
        };
      `;

            const blob = new Blob([workerCode], {
                type: "application/javascript",
            });
            const url = URL.createObjectURL(blob);
            worker = new Worker(url);

            worker.onmessage = (ev) => {
                const data = ev.data;
                if (!data) return;
                if (data.type === "progress") {
                    onProgress?.(data.attempts ?? 0);
                } else if (data.type === "result") {
                    resolve(data.result as PoWResult);
                    // cleanup
                    try {
                        worker?.terminate();
                    } catch {}
                    URL.revokeObjectURL(url);
                } else if (data.type === "cancelled") {
                    resolve(null);
                    try {
                        worker?.terminate();
                    } catch {}
                    URL.revokeObjectURL(url);
                } else if (data.type === "done") {
                    resolve(null);
                    try {
                        worker?.terminate();
                    } catch {}
                    URL.revokeObjectURL(url);
                } else if (data.type === "error") {
                    resolve(null);
                    try {
                        worker?.terminate();
                    } catch {}
                    URL.revokeObjectURL(url);
                }
            };

            worker.postMessage({ difficulty, challenge, ts, maxAttempts });

            return;
        }

        // Fallback: compute on main thread (still reports progress)
        try {
            const enc = new TextEncoder();
            let attempts = 0;
            while (attempts < maxAttempts) {
                if (cancelled) {
                    resolve(null);
                    return;
                }
                const nonce = String(attempts);
                const data = enc.encode(`${nonce}:${ts}:${challenge}`);
                const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
                if (hashHex.startsWith("0".repeat(difficulty))) {
                    resolve({ nonce, hash: hashHex, ts });
                    return;
                }
                attempts++;
                if (attempts % 1000 === 0) {
                    onProgress?.(attempts);
                    // yield to event loop occasionally
                    await new Promise((r) => setTimeout(r, 0));
                }
            }
            resolve(null);
        } catch {
            resolve(null);
        }
    });

    const cancel = () => {
        cancelled = true;
        try {
            if (worker) worker.postMessage("cancel");
        } catch {}
    };

    return { promise, cancel };
}

export default computePoW;
