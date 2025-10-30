import { NextResponse } from "next/server";
import { initializeOrm } from "@/server/orm";
import { RecruiterAccess } from "@/server/entities/RecruiterAccess";
import { sendTelegramNotification } from "@/lib/notifications";

function generateCode() {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    try {
        const orm = await initializeOrm();
        const repo = orm.getRepository(RecruiterAccess);

        const body = await request.json().catch(() => ({}));
        const requesterInfo =
            body.requester ||
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const access = repo.create({ code, expiresAt, requesterInfo });
        await repo.save(access);

        const message = `Demande d'accès recruteur\nCode: ${code}\nValide jusqu'à: ${expiresAt.toISOString()}\nRequester: ${requesterInfo}`;
        console.log("[API] Recruiter access requested:", message);

        // send telegram notification (best-effort)
        sendTelegramNotification(message).catch((e) =>
            console.error("Telegram error", e)
        );

        return NextResponse.json({
            success: true,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
        console.error("Error creating recruiter access", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
