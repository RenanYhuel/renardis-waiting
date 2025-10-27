import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import getDb from "@/server/db";
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

function verifyAuth(req: NextApiRequest) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const user = verifyAuth(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const db = await getDb();
        const rows = await db.all(
            "SELECT id, firstName, lastName, email, specialty, status, createdAt FROM candidates ORDER BY createdAt DESC"
        );
        return res.status(200).json({ candidates: rows });
    } catch (err) {
        console.error("admin/candidates error", err);
        return res.status(500).json({ error: "Internal error" });
    }
}
