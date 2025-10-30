import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { sendDiscordWebhook } from "@/lib/discordWebhook";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
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
