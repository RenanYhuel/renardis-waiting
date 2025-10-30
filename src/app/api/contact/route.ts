import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { sendDiscordWebhook } from "@/lib/discordWebhook";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nom, email, message } = body;

        if (!nom || !email || !message) {
            return NextResponse.json(
                { error: "Tous les champs requis doivent être remplis" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Format d'email invalide" },
                { status: 400 }
            );
        }

        logger.info(`Contact reçu : ${nom} <${email}>`);
        if (process.env.DISCORD_WEBHOOK_URL) {
            try {
                await sendDiscordWebhook("", process.env.DISCORD_WEBHOOK_URL, {
                    nom,
                    email,
                    username: "Renardis Notification",
                });
                logger.info("Webhook Discord envoyé avec succès.");
            } catch (err) {
                logger.error(
                    "Erreur lors de l'envoi du webhook Discord :",
                    err
                );
            }
        }
        // Send all contact info to Telegram chat
        try {
            const { sendTelegramNotification } = await import(
                "@/lib/notifications"
            );
            const telegramMessage = `Nouveau contact\nNom: ${nom}\nEmail: ${email}\nMessage: ${message}`;
            await sendTelegramNotification(telegramMessage);
        } catch (err) {
            logger.error("Erreur lors de l'envoi du message Telegram :", err);
        }
        return NextResponse.json(
            {
                success: true,
                message: "Message envoyé avec succès !",
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Erreur lors de l'envoi du message:", error);
        return NextResponse.json(
            {
                error: "Erreur lors de l'envoi du message. Veuillez réessayer.",
                details:
                    process.env.NODE_ENV === "development" ? error : undefined,
            },
            { status: 500 }
        );
    }
}
