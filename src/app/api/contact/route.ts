import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { verifyAntiBot } from "@/lib/antiBot";
import { sendDiscordWebhook } from "@/lib/discordWebhook";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const anti = await verifyAntiBot(request, body, {
            max: 3, // very few submissions allowed per window
            windowMs: 60 * 60 * 1000, // 1 hour window
            minSubmitMs: 7000, // require at least 7s between form load and submit
            maxSubmitMs: 10 * 60 * 1000, // tokens older than 10 minutes are rejected
            powDifficulty: 6, // stronger PoW requirement
            blockDurationMs: 2 * 60 * 60 * 1000, // block offenders for 2 hours
        });
        if (!anti.ok) {
            logger.warn("Contact rejected by anti-bot:", anti.reason);
            return NextResponse.json(
                { error: "Rejeté par le système anti-spam" },
                { status: 429 }
            );
        }
        const { fullName, email, phone, company, subject, message } = body;

        if (!fullName || !email || !message) {
            return NextResponse.json(
                { error: "Nom, email et message sont requis" },
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

        logger.info(`Contact reçu : ${fullName} <${email}>`);
        if (process.env.DISCORD_WEBHOOK_URL) {
            try {
                const embed = {
                    title: "📬 Nouveau contact Renardis",
                    color: 0x5865f2,
                    fields: [
                        { name: "Nom", value: fullName, inline: true },
                        { name: "Email", value: email, inline: true },
                        ...(phone
                            ? [
                                  {
                                      name: "Téléphone",
                                      value: phone,
                                      inline: true,
                                  },
                              ]
                            : []),
                        ...(company
                            ? [
                                  {
                                      name: "Société",
                                      value: company,
                                      inline: true,
                                  },
                              ]
                            : []),
                        ...(subject ? [{ name: "Sujet", value: subject }] : []),
                        { name: "Message", value: message },
                    ],
                    timestamp: new Date().toISOString(),
                };
                await sendDiscordWebhook("", process.env.DISCORD_WEBHOOK_URL, {
                    username: "Renardis Notification",
                    embed,
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
            let telegramMessage = `Nouveau contact\nNom: ${fullName}\nEmail: ${email}`;
            if (phone) telegramMessage += `\nTéléphone: ${phone}`;
            if (company) telegramMessage += `\nSociété: ${company}`;
            if (subject) telegramMessage += `\nSujet: ${subject}`;
            telegramMessage += `\nMessage: ${message}`;
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
