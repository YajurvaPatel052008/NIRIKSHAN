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
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Set backend secrets and service
configuration in `backend/.env`; never commit that file.

The backend targets **Python 3.11**. PaddleOCR and PaddlePaddle compatibility
depends on the Python version, so pin it explicitly in a `runtime.txt` file if
the deployment host requires one.

### Supabase database schema

The initial PostgreSQL schema is in
`backend/sql/001_init_schema.sql`. Paste the file into the Supabase SQL Editor
and run it, or apply it with the Supabase CLI from the repository root:

```powershell
supabase db push
```

The migration includes the application tables, foreign keys, indexes, and
commented RLS policy stubs. Enable and adapt the RLS policies before
production.

The private inspection image bucket is configured by
`backend/sql/002_inspection_storage.sql`. Run it after the initial schema
migration. It creates the `inspection-images` bucket with a 10 MB limit,
JPG/PNG/WEBP restrictions, and public access disabled. The backend uploads
images with the service-role key and returns short-lived signed URLs; do not
make this bucket public.

## Environment variables

| Application | File | Variables |
| --- | --- | --- |
| Frontend | `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| Backend | `backend/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GROQ_API_KEY`, `ALLOWED_ORIGINS`, `ENVIRONMENT` |

`ALLOWED_ORIGINS` is a comma-separated list. For production, set it to the
deployed Vercel frontend origin (and any additional trusted origins).
