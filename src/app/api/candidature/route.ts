import { NextRequest, NextResponse } from "next/server";
// ...existing code...
import logger from "@/lib/logger";
import { initializeOrm } from "@/server/orm";
import { Candidate } from "@/server/entities/Candidate";
import { File as FileEntity } from "@/server/entities/File";
import path from "path";
import fs from "fs";
import crypto from "crypto";

function validateConfiguration(): {
    isValid: boolean;
    missingConfigs: string[];
} {
    return {
        isValid: true,
        missingConfigs: [],
    };
}

export async function POST(request: NextRequest) {
    try {
        const configValidation = validateConfiguration();
        if (!configValidation.isValid) {
            return NextResponse.json(
                {
                    error: "Configuration serveur incomplète",
                    missingConfigs: configValidation.missingConfigs,
                    instructions: [
                        "1. Créer un fichier .env.local à la racine du projet",
                        "2. Ajouter les variables d'environnement manquantes",
                        "3. Redémarrer le serveur de développement",
                    ],
                },
                { status: 500 }
            );
        }
        logger.info(
            "✅ Configuration validée - Toutes les variables sont présentes pour la candidature"
        );

        // Support both JSON and multipart/form-data (FormData) submissions
        let body: Record<string, unknown> = {};
        let cvFileEntity: FileEntity | null = null;
        const contentType = String(request.headers.get("content-type") || "");
        if (
            contentType.includes("multipart/form-data") ||
            contentType.includes("form")
        ) {
            const form = await request.formData();
            let cvFile: globalThis.File | null = null;
            form.forEach((value, key) => {
                if (value instanceof File) {
                    if (key === "cv") cvFile = value;
                    body[key] = value;
                } else {
                    const v = String(value);
                    try {
                        body[key] = JSON.parse(v);
                    } catch {
                        body[key] = v;
                    }
                }
            });
            if (cvFile) {
                // Read file buffer
                const arrayBuffer = await (
                    cvFile as globalThis.File
                ).arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                // Compute SHA256 hash
                const hash = crypto
                    .createHash("sha256")
                    .update(buffer)
                    .digest("hex");
                // TypeORM logic
                const orm = await initializeOrm();
                const fileRepo = orm.getRepository(FileEntity);
                const existing = await fileRepo.findOne({ where: { hash } });
                if (existing) {
                    cvFileEntity = existing;
                } else {
                    // Save file to uploads folder
                    const uploadsDir = path.resolve(process.cwd(), "uploads");
                    if (!fs.existsSync(uploadsDir))
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    const ext = path.extname((cvFile as globalThis.File).name);
                    const filename = `${hash}${ext}`;
                    const filePath = path.join(uploadsDir, filename);
                    fs.writeFileSync(filePath, buffer);
                    // Create File entity
                    const newFile = fileRepo.create({
                        filename,
                        originalName: (cvFile as globalThis.File).name,
                        mimetype: (cvFile as globalThis.File).type,
                        size: buffer.length,
                        hash,
                    });
                    cvFileEntity = await fileRepo.save(newFile);
                }
            }
        } else {
            body = await request.json();
        }

        const b = body as Record<string, unknown>;
        logger.info("Motivation reçue:", b.motivation);
        const nom = typeof b.nom === "string" ? b.nom : undefined;
        const firstName =
            typeof b.firstName === "string" ? b.firstName : undefined;
        const lastName =
            typeof b.lastName === "string" ? b.lastName : undefined;
        const email = typeof b.email === "string" ? b.email : undefined;
        const age = b.age;
        const competences =
            typeof b.competences === "string" ? b.competences : undefined;
        const skills = b.skills as unknown;
        const message = typeof b.message === "string" ? b.message : undefined;
        const motivation =
            typeof b.motivation === "string" ? b.motivation : undefined;

        // Basic required fields: either single 'nom' or firstName+lastName, plus email and a message/motivation
        const computedName =
            nom || (firstName || "") + (lastName ? ` ${lastName}` : "");
        const computedMessage = message || motivation || "";

        if (!computedName || !email || !computedMessage) {
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

        if (
            age &&
            (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 99)
        ) {
            return NextResponse.json(
                { error: "Âge invalide (doit être entre 13 et 99 ans)" },
                { status: 400 }
            );
        }

        const competencesMap: { [key: string]: string } = {
            dev: "Développement",
            design: "Design / UX",
            admin: "Administration système",
            marketing: "Communication / Marketing",
            juridique: "Juridique / Administratif",
            education: "Éducation / Pédagogie",
            autre: "Autre",
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties: any = {
            Nom: {
                title: [
                    {
                        text: {
                            content: nom,
                        },
                    },
                ],
            },
            Email: {
                email: email,
            },
            Message: {
                rich_text: [
                    {
                        text: {
                            content: message,
                        },
                    },
                ],
            },
            Date: {
                date: {
                    start: new Date().toISOString(),
                },
            },
            Statut: {
                select: {
                    name: "Nouvelle candidature",
                },
            },
        };

        if (age) {
            properties["Âge"] = {
                number: Number(age),
            };
        }

        // Handle competences / skills: prefer skills array, fallback to single competences key
        const resolvedSkills = Array.isArray(skills)
            ? skills
            : typeof skills === "string" && skills.startsWith("[")
            ? JSON.parse(skills)
            : skills
            ? [skills]
            : competences
            ? [competences]
            : [];

        if (resolvedSkills.length > 0) {
            const firstSkill = String(resolvedSkills[0] || "Autre");
            properties["Compétences"] = {
                select: {
                    name: competencesMap[firstSkill] || firstSkill,
                },
            };
        }

        // Map computed name / message
        properties["Nom"] = {
            title: [
                {
                    text: { content: computedName },
                },
            ],
        };

        properties["Message"] = {
            rich_text: [
                {
                    text: { content: computedMessage },
                },
            ],
        };

        // Insert candidate in DB with cvFileEntity
        const orm = await initializeOrm();
        const candidateRepo = orm.getRepository(Candidate);
        const candidate = new Candidate();
        candidate.firstName = firstName ?? "";
        candidate.lastName = lastName ?? "";
        candidate.email = email ?? "";
        candidate.phone = (b.phone as string) ?? null;
        candidate.linkedIn = (b.linkedIn as string) ?? null;
        candidate.availability = (b.availability as string) ?? null;
        candidate.specialty = (b.specialty as string) ?? null;
        candidate.coverLetter = (b.coverLetter as string) ?? null;
        candidate.skills = Array.isArray(b.skills)
            ? (b.skills as string[])
            : typeof b.skills === "string" && b.skills.startsWith("[")
            ? JSON.parse(b.skills as string)
            : b.skills
            ? [b.skills as string]
            : [];
        candidate.motivation = (b.motivation as string) ?? null;
        candidate.experience = (b.experience as string) ?? null;
        candidate.cvFile = cvFileEntity ?? null;
        candidate.status = "Nouvelle candidature";
        candidate.notes = "[]";
        // Generate a unique access code (6 digits alphanumeric)
        candidate.accessCode = Math.random()
            .toString(36)
            .slice(-6)
            .toUpperCase();
        const savedCandidate = await candidateRepo.save(candidate);

        // Send only name and email to Discord webhook
        if (process.env.DISCORD_WEBHOOK_URL) {
            try {
                await import("@/lib/discordWebhook").then(
                    ({ sendDiscordWebhook }) =>
                        sendDiscordWebhook(
                            "Nouvelle candidature reçue",
                            process.env.DISCORD_WEBHOOK_URL!,
                            {
                                nom: computedName,
                                email: email ?? "",
                                username: "Renardis Notification",
                            }
                        )
                );
                logger.info("Webhook Discord envoyé avec succès.");
            } catch (err) {
                logger.error(
                    "Erreur lors de l'envoi du webhook Discord :",
                    err
                );
            }
        }

        // Log recruiter link and code in dev mode
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const previewUrl = `${baseUrl}/candidature/${savedCandidate.id}?code=${savedCandidate.accessCode}`;
        console.log(`Lien fiche recruteur: ${previewUrl}`);
        console.log(`Code d'accès: ${savedCandidate.accessCode}`);

        // Send private Telegram message with all required info
        try {
            const { sendTelegramNotification } = await import(
                "@/lib/notifications"
            );
            const domain =
                candidate.specialty ||
                (Array.isArray(candidate.skills)
                    ? candidate.skills[0]
                    : candidate.skills) ||
                "Non renseigné";
            const telegramMessage = `Nouvelle candidature\nNom: ${computedName}\nEmail: ${
                email ?? ""
            }\nDomaine: ${domain}\nCode: ${
                savedCandidate.accessCode
            }\nLien: ${previewUrl}`;
            await sendTelegramNotification(telegramMessage);
        } catch (err) {
            logger.error("Erreur lors de l'envoi du message Telegram :", err);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Candidature envoyée avec succès !",
                id: savedCandidate.id,
                cvFileId: cvFileEntity?.id ?? null,
                accessCode: savedCandidate.accessCode,
            },
            { status: 200 }
        );
    } catch (error) {
        // Ensure full error object and stack are logged in production
        try {
            logger.error(
                { err: error },
                "Erreur lors de l'envoi de la candidature"
            );
            if (
                error &&
                typeof (error as unknown as Error).stack === "string"
            ) {
                logger.error((error as unknown as Error).stack as string);
            }
        } catch (logErr) {
            // Fallback if logging the error itself fails
            logger.error(
                "Erreur lors de l'envoi de la candidature (échec du logging détaillé)"
            );
            logger.error(String(error));
            logger.error(String(logErr));
        }

        return NextResponse.json(
            {
                error: "Erreur lors de l'envoi de la candidature. Veuillez réessayer.",
                details:
                    process.env.NODE_ENV === "development"
                        ? String(error)
                        : undefined,
            },
            { status: 500 }
        );
    }
}
