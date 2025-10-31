import crypto from "crypto";
import { NextRequest } from "next/server";

/**
 * Robust Anti-Bot Protection System
 * Features: Honeypot, Rate Limiting, Proof-of-Work, Timestamp validation
 */

// Types
interface RateInfo {
    timestamps: number[];
    violations: number;
    lastViolation: number;
}

interface PoWToken {
    nonce: string;
    hash: string;
}

interface VerificationOptions {
    max?: number;
    windowMs?: number;
    minSubmitMs?: number;
    maxSubmitMs?: number;
    powDifficulty?: number;
    blockDurationMs?: number;
}

interface VerificationResult {
    ok: boolean;
    reason?: string;
    details?: Record<string, unknown>;
}

// Configuration constants
const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX = 10; // Max requests per window
const DEFAULT_MIN_MS = 3000; // Min 3 seconds between form load and submit
const DEFAULT_MAX_MS = 30 * 60 * 1000; // Max 30 minutes (prevents stale tokens)
const DEFAULT_POW_DIFFICULTY = 4; // Number of leading zeros required
const DEFAULT_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block
const PUBLIC_CHALLENGE = "renardis-v1";
const MAX_VIOLATIONS_BEFORE_BLOCK = 5;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

// In-memory storage (use Redis in production)
const RATE_MAP = new Map<string, RateInfo>();
const BLOCKED_IPS = new Map<string, number>();
const USED_NONCES = new Set<string>();

// Cleanup old entries periodically
let lastCleanup = Date.now();

/**
 * Extract client IP from request headers
 */
function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");

    // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For
    const ip = cfConnectingIp || realIp || forwardedFor;

    if (ip) {
        return ip.split(",")[0].trim();
    }

    return "unknown";
}

/**
 * SHA-256 hash utility
 */
function sha256Hex(input: string): string {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Validate honeypot field (should be empty)
 */
function validateHoneypot(
    body: Record<string, unknown> | undefined
): VerificationResult {
    if (!body) return { ok: true };

    const honeypotFields = ["_hp", "hp", "email_confirm", "phone_number"];

    for (const field of honeypotFields) {
        const value = body[field];
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return {
                ok: false,
                reason: "honeypot triggered",
                details: { field },
            };
        }
    }

    return { ok: true };
}

/**
 * Validate timestamp (presence, format, and time bounds)
 */
function validateTimestamp(
    body: Record<string, unknown> | undefined,
    minMs: number,
    maxMs: number
): VerificationResult {
    if (!body) {
        return { ok: false, reason: "missing request body" };
    }

    const tsRaw = body["ts"] ?? body["timestamp"];

    if (!tsRaw) {
        return { ok: false, reason: "missing timestamp" };
    }

    const ts = Number(tsRaw);

    if (!Number.isFinite(ts) || ts <= 0) {
        return { ok: false, reason: "invalid timestamp format" };
    }

    const now = Date.now();
    const elapsed = now - ts;

    if (elapsed < minMs) {
        return {
            ok: false,
            reason: "submitted too fast",
            details: { elapsed, required: minMs },
        };
    }

    if (elapsed > maxMs) {
        return {
            ok: false,
            reason: "token expired",
            details: { elapsed, maxAllowed: maxMs },
        };
    }

    return { ok: true, details: { timestamp: ts, elapsed } };
}

/**
 * Parse and validate Proof-of-Work token
 */
function parsePoWToken(powRaw: unknown): PoWToken | null {
    try {
        let parsed: unknown;

        if (typeof powRaw === "string") {
            parsed = JSON.parse(powRaw);
        } else if (typeof powRaw === "object" && powRaw !== null) {
            parsed = powRaw;
        } else {
            return null;
        }

        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        const obj = parsed as Record<string, unknown>;

        if (typeof obj.nonce !== "string" || typeof obj.hash !== "string") {
            return null;
        }

        // Validate format (hex strings)
        if (
            !/^[a-f0-9]+$/i.test(obj.nonce) ||
            !/^[a-f0-9]{64}$/i.test(obj.hash)
        ) {
            return null;
        }

        return {
            nonce: obj.nonce,
            hash: obj.hash.toLowerCase(),
        };
    } catch {
        return null;
    }
}

/**
 * Validate Proof-of-Work
 */
function validateProofOfWork(
    body: Record<string, unknown> | undefined,
    timestamp: number,
    difficulty: number
): VerificationResult {
    if (!body) {
        return { ok: false, reason: "missing request body" };
    }

    const powRaw = body["pow"] ?? body["powToken"];

    if (!powRaw) {
        return { ok: false, reason: "missing proof-of-work" };
    }

    const powToken = parsePoWToken(powRaw);

    if (!powToken) {
        return { ok: false, reason: "invalid proof-of-work format" };
    }

    // Check if nonce was already used (prevent replay attacks)
    if (USED_NONCES.has(powToken.nonce)) {
        return { ok: false, reason: "proof-of-work already used" };
    }

    // Verify hash matches the expected value
    const expected = sha256Hex(
        `${powToken.nonce}:${timestamp}:${PUBLIC_CHALLENGE}`
    );

    if (expected !== powToken.hash) {
        return { ok: false, reason: "proof-of-work hash mismatch" };
    }

    // Verify difficulty (leading zeros)
    const requiredPrefix = "0".repeat(difficulty);

    if (!powToken.hash.startsWith(requiredPrefix)) {
        return {
            ok: false,
            reason: "insufficient proof-of-work difficulty",
            details: { required: difficulty, hash: powToken.hash },
        };
    }

    // Store nonce to prevent reuse
    USED_NONCES.add(powToken.nonce);

    return { ok: true };
}

/**
 * Check and update rate limit
 */
function checkRateLimit(
    ip: string,
    max: number,
    windowMs: number,
    blockDurationMs: number
): VerificationResult {
    const now = Date.now();

    // Check if IP is blocked
    const blockUntil = BLOCKED_IPS.get(ip);
    if (blockUntil && now < blockUntil) {
        const remainingMs = blockUntil - now;
        return {
            ok: false,
            reason: "IP temporarily blocked",
            details: {
                remainingMs,
                remainingMinutes: Math.ceil(remainingMs / 60000),
            },
        };
    } else if (blockUntil) {
        BLOCKED_IPS.delete(ip);
    }

    // Get or create rate info
    const info = RATE_MAP.get(ip) ?? {
        timestamps: [],
        violations: 0,
        lastViolation: 0,
    };

    // Clean old timestamps
    info.timestamps = info.timestamps.filter((t) => now - t <= windowMs);

    // Check rate limit
    if (info.timestamps.length >= max) {
        info.violations++;
        info.lastViolation = now;

        // Block IP after too many violations
        if (info.violations >= MAX_VIOLATIONS_BEFORE_BLOCK) {
            BLOCKED_IPS.set(ip, now + blockDurationMs);
            return {
                ok: false,
                reason: "rate limit exceeded - IP blocked",
                details: { blockDurationMs },
            };
        }

        RATE_MAP.set(ip, info);
        return {
            ok: false,
            reason: "rate limit exceeded",
            details: {
                current: info.timestamps.length,
                max,
                violations: info.violations,
            },
        };
    }

    // Add timestamp and update
    info.timestamps.push(now);
    RATE_MAP.set(ip, info);

    return { ok: true };
}

/**
 * Cleanup old entries from memory
 */
function cleanupStorage(windowMs: number): void {
    const now = Date.now();

    // Only cleanup every CLEANUP_INTERVAL
    if (now - lastCleanup < CLEANUP_INTERVAL) {
        return;
    }

    lastCleanup = now;

    // Cleanup rate map
    for (const [ip, info] of RATE_MAP.entries()) {
        info.timestamps = info.timestamps.filter((t) => now - t <= windowMs);

        // Reset violations if last violation was long ago
        if (now - info.lastViolation > windowMs) {
            info.violations = 0;
        }

        // Remove empty entries
        if (info.timestamps.length === 0 && info.violations === 0) {
            RATE_MAP.delete(ip);
        } else {
            RATE_MAP.set(ip, info);
        }
    }

    // Cleanup blocked IPs
    for (const [ip, blockUntil] of BLOCKED_IPS.entries()) {
        if (now >= blockUntil) {
            BLOCKED_IPS.delete(ip);
        }
    }

    // Cleanup old nonces (keep last 10000)
    if (USED_NONCES.size > 10000) {
        const toKeep = Array.from(USED_NONCES).slice(-5000);
        USED_NONCES.clear();
        toKeep.forEach((n) => USED_NONCES.add(n));
    }
}

/**
 * Main verification function
 */
export async function verifyAntiBot(
    req: NextRequest,
    body: Record<string, unknown> | undefined,
    opts?: VerificationOptions
): Promise<VerificationResult> {
    try {
        // Extract options with defaults
        const {
            max = DEFAULT_MAX,
            windowMs = DEFAULT_WINDOW_MS,
            minSubmitMs = DEFAULT_MIN_MS,
            maxSubmitMs = DEFAULT_MAX_MS,
            powDifficulty = DEFAULT_POW_DIFFICULTY,
            blockDurationMs = DEFAULT_BLOCK_DURATION,
        } = opts ?? {};

        // Get client IP
        const ip = getClientIp(req);

        // Validate request body exists
        if (!body || typeof body !== "object") {
            return { ok: false, reason: "invalid request body" };
        }

        // 1. Honeypot check
        const honeypotResult = validateHoneypot(body);
        if (!honeypotResult.ok) {
            return honeypotResult;
        }

        // 2. Timestamp validation
        const timestampResult = validateTimestamp(
            body,
            minSubmitMs,
            maxSubmitMs
        );
        if (!timestampResult.ok) {
            return timestampResult;
        }

        const timestamp = timestampResult.details?.timestamp as number;

        // 3. Proof-of-Work validation
        const powResult = validateProofOfWork(body, timestamp, powDifficulty);
        if (!powResult.ok) {
            return powResult;
        }

        // 4. Rate limiting
        const rateLimitResult = checkRateLimit(
            ip,
            max,
            windowMs,
            blockDurationMs
        );
        if (!rateLimitResult.ok) {
            return rateLimitResult;
        }

        // 5. Cleanup old data
        cleanupStorage(windowMs);

        // All checks passed
        return { ok: true };
    } catch (error) {
        // Log error in production
        console.error("Anti-bot verification error:", error);
        return {
            ok: false,
            reason: "verification failed",
            details: {
                error: error instanceof Error ? error.message : "unknown error",
            },
        };
    }
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(req: NextRequest): {
    ip: string;
    requestCount: number;
    violations: number;
    isBlocked: boolean;
    blockRemainingMs?: number;
} {
    const ip = getClientIp(req);
    const info = RATE_MAP.get(ip);
    const blockUntil = BLOCKED_IPS.get(ip);
    const now = Date.now();

    return {
        ip,
        requestCount: info?.timestamps.length ?? 0,
        violations: info?.violations ?? 0,
        isBlocked: blockUntil ? now < blockUntil : false,
        blockRemainingMs:
            blockUntil && now < blockUntil ? blockUntil - now : undefined,
    };
}

/**
 * Debug function to inspect rate map
 */
export function debugRateMap(): Array<{
    ip: string;
    count: number;
    violations: number;
    isBlocked: boolean;
}> {
    const now = Date.now();

    return Array.from(RATE_MAP.entries()).map(([ip, info]) => ({
        ip,
        count: info.timestamps.length,
        violations: info.violations,
        isBlocked: BLOCKED_IPS.has(ip) && now < (BLOCKED_IPS.get(ip) ?? 0),
    }));
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearRateLimits(): void {
    RATE_MAP.clear();
    BLOCKED_IPS.clear();
    USED_NONCES.clear();
}

/**
 * Generate challenge for client-side PoW
 */
export function generateChallenge(timestamp: number): {
    challenge: string;
    timestamp: number;
    difficulty: number;
} {
    return {
        challenge: PUBLIC_CHALLENGE,
        timestamp,
        difficulty: DEFAULT_POW_DIFFICULTY,
    };
}
