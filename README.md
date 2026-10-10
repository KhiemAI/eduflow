# EduFlow

EduFlow is a React, TypeScript, and Vite timetable manager. Shared school data, authentication, and realtime updates are provided by Supabase. Authentication tokens use `sessionStorage`; application data is stored only in Supabase, never in `localStorage`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/20261010000000_workspace_sync.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in the project's URL and publishable (anon) key.
4. Install dependencies and start the app:

   ```sh
   npm ci
   npm run dev
   ```

5. Register the first account and create the school's workspace. New members must register first; an admin can then add their email with the person-plus button. Invited users can select **Kiểm tra lời mời** after signing in.

## Deploy to Vercel

Import the GitHub repository into Vercel. Use the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Vercel Project Settings > Environment Variables, then redeploy. Apply the Supabase migration before signing in. The `vercel.json` rewrite supports client-side routes.

Only the Supabase publishable/anon key belongs in frontend environment variables. Never add the service-role key to this app.
