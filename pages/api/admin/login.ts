import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "changeme";
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST")
        return res.status(405).json({ error: "Method not allowed" });

    const { username, password } = req.body || {};
    if (!username || !password)
        return res.status(400).json({ error: "Missing credentials" });

    try {
        if (username !== ADMIN_USER)
            return res.status(401).json({ error: "Invalid credentials" });

        // If ADMIN_PASSWORD is plain text, compare with bcrypt if hash stored
        const isMatch =
            password === ADMIN_PASS || bcrypt.compareSync(password, ADMIN_PASS);
        if (!isMatch)
            return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "8h" });
        return res.status(200).json({ token });
    } catch (err) {
        console.error("Login error", err);
        return res.status(500).json({ error: "Internal error" });
    }
}
