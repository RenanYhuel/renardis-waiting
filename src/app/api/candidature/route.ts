import { NextRequest, NextResponse } from 'next/server';
import { notion } from '@/lib/notion';
import logger from '@/lib/logger';
import { sendDiscordWebhook } from '@/lib/discordWebhook';

function validateConfiguration(): { isValid: boolean; missingConfigs: string[] } {
  const missingConfigs: string[] = [];
  
  if (!process.env.NOTION_API_KEY) {
    missingConfigs.push('NOTION_API_KEY - Token d\'authentification Notion manquant');
  }
  
  if (!process.env.NOTION_CANDIDATURE_DATABASE_ID) {
    missingConfigs.push('NOTION_CANDIDATURE_DATABASE_ID - ID de la base de données Notion manquant');
  }
  
  if (!notion) {
    missingConfigs.push('Client Notion - Impossible d\'initialiser le client Notion');
  }
  
  return {
    isValid: missingConfigs.length === 0,
    missingConfigs
  };
}

export async function POST(request: NextRequest) {
  try {
    const configValidation = validateConfiguration();
    
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Configuration serveur incomplète', 
          missingConfigs: configValidation.missingConfigs,
          instructions: [
            '1. Créer un fichier .env.local à la racine du projet',
            '2. Ajouter les variables d\'environnement manquantes',
            '3. Redémarrer le serveur de développement'
          ]
        },
        { status: 500 }
      );
    }

    logger.info('✅ Configuration validée - Toutes les variables sont présentes pour la candidature');

    const body = await request.json();
    const { nom, email, age, competences, message } = body;

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

    if (age && (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 99)) {
      return NextResponse.json(
        { error: 'Âge invalide (doit être entre 13 et 99 ans)' },
        { status: 400 }
      );
    }

    const competencesMap: { [key: string]: string } = {
      'dev': 'Développement',
      'design': 'Design / UX',
      'admin': 'Administration système',
      'marketing': 'Communication / Marketing',
      'juridique': 'Juridique / Administratif',
      'education': 'Éducation / Pédagogie',
      'autre': 'Autre'
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: any = {
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
        email: email,
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
        select: {
          name: 'Nouvelle candidature',
        },
      },
    };

    if (age) {
      properties['Âge'] = {
        number: Number(age),
      };
    }

    if (competences && competences !== '') {
      properties['Compétences'] = {
        select: {
          name: competencesMap[competences] || competences,
        },
      };
    }

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_CANDIDATURE_DATABASE_ID!,
      },
      properties,
    });

    logger.info(`Candidature créée dans Notion : ${nom} <${email}>`);
    type NotionResponse = { id: string; url?: string };
    const notionRes = response as NotionResponse;
    logger.info(`Lien Notion : ${notionRes.url || `https://notion.so/${notionRes.id.replace(/-/g, '')}`}`);
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await sendDiscordWebhook(
          '',
          process.env.DISCORD_WEBHOOK_URL,
          {
            nom,
            email,
            contenu: '', // Le contenu principal est dans l'embed
            notionUrl: notionRes.url || `https://notion.so/${notionRes.id.replace(/-/g, '')}`,
            username: 'Renardis Notification',
            // Ajout d'un embed structuré
            embed: {
              title: '📝 Nouvelle Candidature',
              color: 0x5865F2,
              fields: [
                { name: 'Nom', value: nom, inline: true },
                { name: 'Email', value: email, inline: true },
                { name: 'Âge', value: age ? String(age) : 'Non renseigné', inline: true },
                { name: 'Compétences', value: competencesMap[competences] || competences || 'Non renseigné', inline: true },
                { name: 'Message', value: message, inline: false },
                { name: 'Lien Notion', value: `[Voir la fiche](${notionRes.url || `https://notion.so/${notionRes.id.replace(/-/g, '')}`})`, inline: false },
              ],
              timestamp: new Date().toISOString(),
            }
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
        message: 'Candidature envoyée avec succès !',
        id: response.id 
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Erreur lors de l'envoi de la candidature:", error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'envoi de la candidature. Veuillez réessayer.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
