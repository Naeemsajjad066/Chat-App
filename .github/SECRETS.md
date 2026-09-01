# Required GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

## Secrets needed

| Secret name | Where to get it | Used by |
|---|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create | Both deploy jobs |
| `VITE_BACKEND_URL` | Your deployed server URL e.g. `https://your-api.vercel.app` | Client build + deploy |

## Vercel project linking (one-time setup)

Run these locally before the first deploy so Vercel knows which project to deploy to:

```bash
# Link client
cd client
npx vercel link   # follow prompts, select your client project

# Link server
cd ../server
npx vercel link   # follow prompts, select your server project
```

This creates `.vercel/project.json` in each folder which the CI workflow reads.
Add `.vercel/` to your gitignore if you don't want to commit it (it's fine to commit).

## How the pipeline works

```
Push to any branch
      │
      ▼
  CI workflow
  ├── client: npm ci → build → lint
  └── server: npm ci → node --check

Push to main (after CI passes)
      │
      ▼
  Deploy workflow (parallel)
  ├── deploy-client → Vercel (production)
  └── deploy-server → Vercel (production)
```
