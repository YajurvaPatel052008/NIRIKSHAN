# NIRIKSHA

NIRIKSHA is a monorepo with two independently deployable applications:

- `frontend/` is a Next.js JavaScript app deployed to Vercel.
- `backend/` is a FastAPI app deployed to Railway.

## Local development

### Frontend

```powershell
cd frontend
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. Set the Supabase values and
`NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

For a Vercel deployment, run `vercel deploy` from inside `frontend/` (after
installing and authenticating with the Vercel CLI). Configure the same
`NEXT_PUBLIC_*` variables in the Vercel project settings.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Set backend secrets and service
configuration in `backend/.env`; never commit that file.

## Environment variables

| Application | File | Variables |
| --- | --- | --- |
| Frontend | `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| Backend | `backend/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `GROQ_API_KEY`, `ALLOWED_ORIGINS` |

`ALLOWED_ORIGINS` is a comma-separated list. For production, set it to the
deployed Vercel frontend origin (and any additional trusted origins).
