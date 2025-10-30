## Candidature system - quick start

1. Install dependencies:

```powershell
npm install
npm install --save multer sqlite3 bcryptjs jsonwebtoken nodemailer uuid
```

2. Create `.env.local` with at least:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
JWT_SECRET=change_this_secret
DISCORD_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

3. Run dev server:

```powershell
npm run dev
```

Files added:

-   `src/server/db.ts` - Sqlite helper and migrations
-   `pages/api/candidature.ts` - upload + candidature endpoint
-   `pages/api/admin/*` - admin auth and listing endpoints
-   `src/app/candidature/page.tsx` - candidate form
-   `src/app/admin/page.tsx` - simple admin dashboard
-   `src/lib/notifications.ts` - Telegram helper

Notes:

-   Uploaded CVs are saved in `/uploads` with anonymized UUID filenames. They are served only via `/api/admin/download` which checks JWT.
-   This is a minimal implementation to get started. Next steps: add PDF preview, richer admin actions, Sheets sync, 2FA flow and role/permissions management.
