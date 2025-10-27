import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

function verifyAuth(req: NextApiRequest) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.error("JWT verify error", err);
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { file } = req.query;
    if (!file || typeof file !== "string")
        return res.status(400).json({ error: "Missing file" });

    const filePath = path.join(process.cwd(), "uploads", path.basename(file));
    if (!fs.existsSync(filePath))
        return res.status(404).json({ error: "Not found" });

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(file)}"`
    );
    const stream = fs.createReadStream(filePath);
    // pipe to Next.js response (Node stream)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (stream as any).pipe(res);
}
