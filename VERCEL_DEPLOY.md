# Arenguade Paper Product — Vercel Deployment Guide

## Required Environment Variables

You MUST add these in your **Vercel project dashboard → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key |
| `LIVEKIT_API_KEY` | LiveKit server API key (server-side only) |
| `LIVEKIT_API_SECRET` | LiveKit server API secret (server-side only) |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit websocket URL (e.g. `wss://your-project.livekit.cloud`) |
| `ADMIN_SECURITY_KEYS` | Comma-separated admin registration keys |
| `DATABASE_URL` | Supabase pooler connection string (for direct queries) |
| `DIRECT_URL` | Supabase direct connection string |

## How to Add in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → **Settings** → **Environment Variables**
3. Add each variable above with its value from your `.env.local` file
4. Set **Environment** to `Production, Preview, Development` for all
5. Click **Save** then **Redeploy**

## Build Command
The build command should be: `npm run build`
Output directory: `.next` (Next.js default — leave as auto-detect)

## Explaining the npm Warning
The line `npm warn install-scripts 1 package has install scripts not yet covered by allowScripts` is a **harmless npm 10+ informational warning**. It does not break or fail the build. Your actual build failure is caused by missing environment variables, not this warning.
