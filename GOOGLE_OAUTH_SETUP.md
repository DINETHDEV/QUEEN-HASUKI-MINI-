# Google OAuth 2.0 Setup Guide — Nova X Mini

This document explains how to create Google OAuth 2.0 credentials and configure them for Nova X Mini.

---

## Prerequisites

- A Google account
- Access to the Nova X Mini `.env` file

---

## Step 1 — Open Google Cloud Console

Navigate to https://console.cloud.google.com and sign in.

---

## Step 2 — Create or Select a Project

1. Click the **project dropdown** at the top of the page.
2. Click **New Project**.
3. Enter a project name (e.g., `nova-x-mini-oauth`).
4. Click **Create** and select the new project.

---

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in required fields:
   - **App name**: `Nova X Mini`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue**.
5. On the **Scopes** page, add: `openid`, `email`, `profile`.
6. Click **Save and Continue** through all steps.

> **Note**: While in **Testing** mode, add test user emails on the "Test users" step.
> To allow all Google users, click **Publish App** on the consent screen page.

---

## Step 4 — Create OAuth Client Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials → OAuth client ID**.
3. Select **Application type: Web application**.
4. Enter a name (e.g., `Nova X Mini Web`).

---

## Step 5 — Configure Authorized Redirect URIs

Under **Authorized redirect URIs**, add:

**Development:**
```
http://localhost:5000/auth/google/callback
```

**Production (replace with your actual domain):**
```
https://your-domain.com/auth/google/callback
```

Under **Authorized JavaScript origins**, add:

**Development:**
```
http://localhost:5000
```

Click **Create**.

> WARNING: The URI must match EXACTLY what is in your GOOGLE_CALLBACK_URL env var.

---

## Step 6 — Copy Credentials

After creating, a dialog shows:
- **Client ID**: looks like `1234567890-abc.apps.googleusercontent.com`
- **Client Secret**: looks like `GOCSPX-abc123...`

---

## Step 7 — Update `.env`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Comma-separated emails granted admin on first Google login:
GOOGLE_ADMIN_EMAILS=you@gmail.com,colleague@example.com

# Random string for OAuth state session:
SESSION_SECRET=replace-with-a-long-random-string
```

> NEVER commit .env to version control. It is already in .gitignore.

---

## Step 8 — Restart the Application

```bash
npm start
# or for development:
npm run dev
```

---

## Step 9 — Test the Integration

1. Open http://localhost:5000
2. Click **Continue with Google** on the login page.
3. Sign in with a Google account.
4. You should be redirected to the Nova X Mini dashboard.

---

## Admin Access

Google authentication does NOT automatically grant admin privileges.

- Emails in `GOOGLE_ADMIN_EMAILS` receive `isAdmin=true` ONLY on first account creation.
- Existing users keep their `isAdmin` flag from the database.
- You can manually set `isAdmin: true` in MongoDB for any user.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Callback URL in .env must match exactly what is in Google Cloud Console |
| `access_denied` | User cancelled — expected behaviour |
| `Google Sign-In is not configured` | GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from .env |
| Email not verified error | Google account email is unverified — user must verify with Google |
| Testing mode — not in test list | Add email to Test Users in the OAuth consent screen |

---

## Production Checklist

- [ ] Set GOOGLE_CALLBACK_URL to your production HTTPS domain
- [ ] Add production callback URL to Google Cloud Console
- [ ] Set NODE_ENV=production
- [ ] Change SESSION_SECRET to a long random string
- [ ] Change JWT_SECRET to a long random string
- [ ] Publish the OAuth consent screen if you want all Google users to sign in
