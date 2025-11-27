This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Email & Notifications

Transactional emails (welcome, password reset, order confirmations) are sent through [Brevo](https://www.brevo.com/) (Sendinblue). Provide the following environment variables in your `.env` file before running the app:

```
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=hello@yourdomain.com
BREVO_SENDER_NAME="PaperCloud"
NEXT_PUBLIC_APP_URL=https://your-production-url.com
APP_URL=http://localhost:3000
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
```

- `BREVO_SENDER_NAME` is optional; defaults to "PaperCloud" if omitted.
- `NEXT_PUBLIC_APP_URL` (and optional `APP_URL`) are used to build links inside outbound emails.
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` defaults to 60 minutes if omitted.

If you change the Prisma schema (e.g., for password reset tokens), remember to run `npx prisma generate` so the client reflects the latest database structure.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
