import { NextRequest, NextResponse } from 'next/server';
import { notion } from '@/lib/notion';
import logger from '@/lib/logger';
import { sendDiscordWebhook } from '@/lib/discordWebhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, message } = body;

    if (!nom || !email || !message) {
      return NextResponse.json(
        { error: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (!process.env.NOTION_API_KEY || !process.env.NOTION_CONTACT_DATABASE_ID) {
      return Response.json({ error: "Configuration manquante" }, { status: 500 });
    }

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_CONTACT_DATABASE_ID!,
      },
      properties: {
        'Nom': {
          title: [
            {
              text: {
                content: nom,
              },
            },
          ],
        },
        'Email': {
          rich_text: [
            {
              text: {
                content: email,
              },
            },
          ],
        },
        'Message': {
          rich_text: [
            {
              text: {
                content: message,
              },
            },
          ],
        },
        'Date': {
          date: {
            start: new Date().toISOString(),
          },
        },
        'Statut': {
          status: {
            name: 'Nouveau',
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notionUrl = (response as any).url || `https://notion.so/${response.id.replace(/-/g, '')}`;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    logger.info(`Contact créé dans Notion : ${nom} <${email}>`);
    logger.info(`Lien Notion : ${notionUrl}`);
    if (webhookUrl) {
      try {
        await sendDiscordWebhook(
          '',
          webhookUrl,
          {
            nom,
            email,
            contenu: `Type : Contact\nMessage : ${message}`,
            notionUrl,
            username: 'Renardis Notification',
          }
        );
        logger.info('Webhook Discord envoyé avec succès.');
      } catch (err) {
        logger.error('Erreur lors de l\'envoi du webhook Discord :', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message envoyé avec succès !',
        id: response.id,
        notionUrl,
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Erreur lors de l'envoi du message:", error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
