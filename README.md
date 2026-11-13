# Mahaveer Travels — Easy Ticket (Web Frontend)

Mobile-first React + TypeScript + Tailwind CSS web application connected to **Firebase Firestore** (`ai-studio-android-cb03b148-1b52-4417-8193-07595ee12236` in project `gen-lang-client-0435389835`).

## Local Development

```bash
cd web
npm install
npm run dev
```

## Production Build

```bash
cd web
npm run build
```

This outputs static files into `web/dist`.

## Free Public Deployment Options

### Option 1: Firebase Hosting (Recommended — shares same Firebase project & Google Sign-In domain)
From the repository root (`/`):
```bash
npm --prefix web run build
firebase login
firebase deploy --only hosting --project gen-lang-client-0435389835
```
Your public URL will be:
- `https://gen-lang-client-0435389835.web.app`

### Option 2: Vercel / Netlify (Zero-config free hosting)
- **Vercel**: Import the `web` folder (`vercel.json` is preconfigured).
- **Netlify**: Set base directory to `web` (`netlify.toml` is preconfigured).
- After deploying to Vercel/Netlify, add your deployed domain (e.g., `your-app.vercel.app`) to **Firebase Console → Authentication → Settings → Authorized domains** so Google Sign-In works on the public URL.
