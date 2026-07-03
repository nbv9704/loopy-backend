# Loopy Backend Installation

This guide explains how to run the Loopy backend locally.

## Requirements

- Node.js 22.x.
- Yarn.
- An existing Supabase project.
- Python 3.8+ if Python code execution is used.
- G++ if C++ code execution is used.

## 1. Install dependencies

Run inside the `loopy-backend` directory:

```powershell
yarn install
```

## 2. Configure environment variables

Create `.env` from `.env.example`, then fill in real values:

```powershell
Copy-Item .env.example .env
```

Important variables:

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Notes:

- Do not commit `.env`.
- `FRONTEND_URL` must match the frontend URL so CORS and cookie auth work correctly.
- AI API keys are only required for flows that use AI feedback/grading.

## 3. Prepare the database

The backend uses Supabase PostgreSQL. Make sure the project schema/migrations have been applied to Supabase.

If you use SQL migration files or project scripts, run them according to the current project/Supabase workflow before exposing the app to users.

## 4. Run development server

```powershell
yarn dev
```

The API runs by default at:

```txt
http://localhost:3000
```

Health check:

```txt
GET http://localhost:3000/api/health
```

## 5. Verify before committing

```powershell
yarn lint && yarn build && yarn test --runInBand
```

## 6. Build and run production locally

```powershell
yarn build
yarn start
```

## Common issues

### Frontend is blocked by CORS or login session is not persisted

Check that:

- Backend `FRONTEND_URL` matches the frontend URL.
- Frontend `VITE_API_URL` points to the backend URL.
- Cookie/auth settings are not blocked by the deployment environment.

### Supabase permission errors or missing profile records

Check that:

- `SUPABASE_SERVICE_KEY` is correct and active.
- The migration/trigger that creates `user_profiles` has been applied.
- Required tables and policies exist.

### Python or C++ execution fails

Make sure the local machine has:

- `python` or `python3`.
- `g++` available in PATH.
