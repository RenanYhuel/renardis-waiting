export type DiscordEmbed = {
    title: string;
    color: number;
    fields: Array<{ name: string; value: string; inline?: boolean }>;

    timestamp?: string;
};

export async function sendDiscordWebhook(
    message: string,
    webhookUrl: string,
    options?: {
        nom?: string;
        email?: string;
        contenu?: string;
        notionUrl?: string;
        username?: string;
        embed?: DiscordEmbed;
    }
) {
    const embed: DiscordEmbed = options?.embed || {
        title: "📬 Nouvelle notification Renardis",
        color: 0x5865f2,
        fields: [
            {
                name: "Nom",
                value: options?.nom || "Non renseigné",
                inline: true,
            },
            {
                name: "Email",
                value: options?.email || "Non renseigné",
                inline: true,
            },
            ...(options?.contenu
                ? [{ name: "Message", value: options.contenu }]
                : []),
        ],
        timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: message,
            username: options?.username || "Renardis Notification",
            avatar_url:
                "https://avatars.githubusercontent.com/u/219514618?s=200&v=4",
            embeds: [embed],
        }),
    });
}
