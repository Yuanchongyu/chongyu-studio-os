# Deploy Chongyu Studio OS

## Fastest V1 deployment: GitHub Pages

The current V1 is a static site, so GitHub Pages can host it directly from the repository.

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch **main** and folder **/(root)**.
5. Click **Save**.
6. Wait for GitHub Pages to finish the first deployment.
7. The site will be available at:
   `https://yuanchongyu.github.io/chongyu-studio-os/`

After this, every push to `main` will automatically update the deployed site.

## Important security note

This repository is currently public. Do not commit API keys, Supabase service-role keys, private student records, private parent information, or other secrets into the repository.

The current demo student data is sample seed data. Real student data should live in Supabase behind authentication and Row Level Security, not in GitHub source files.

## Next production milestone

GitHub Pages is ideal for the static V1. Real GPT/Claude manager conversations need a server-side AI Gateway so model API keys never enter browser JavaScript.

Recommended production architecture:

- Frontend / server routes: Vercel
- Database and auth: Supabase
- Structured company memory: Supabase Postgres
- File storage: Supabase Storage
- AI Gateway: server-side OpenAI + Anthropic calls
- Manager UI: the existing Manager Workspace
- Skills / context engine: shared Studio service layer

When the AI Gateway is implemented, move the production deployment to Vercel (or another secure server-side host) while keeping GitHub as the source of truth.
