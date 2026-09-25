## Requirements

- Python 3.11 or 3.12
- Node.js 20 or newer
- A local Keycloak instance (realm, client, and users you configure yourself)
- Git

## 1. Clone and install

```bash
git clone https://git.beehyv.com/saroja.bamra/fastapi-assignment
cd fastapi-assignment
python -m venv ecommerce-venv
source ecommerce-venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
npm install --prefix client
```

## 2. Environment

Copy the example and set your Keycloak client secret:

```bash
cp .env.example .env
```

`.env` needs:

- `KEYCLOAK_URL` — e.g. `http://localhost:8080`
- `KEYCLOAK_REALM` — e.g. `ecommerce`
- `KEYCLOAK_CLIENT_ID` — e.g. `ecommerce-api`
- `KEYCLOAK_CLIENT_SECRET` — from your Keycloak client

Optional: `CORS_ORIGINS` (defaults to `http://localhost:5173`).

## 3. Keycloak

Run Keycloak on your machine and create:

- A realm matching `KEYCLOAK_REALM`
- A confidential client matching `KEYCLOAK_CLIENT_ID`, with the secret in `.env`
- Direct access grants enabled on the client if you use password login from the API
- A user with username `admin` (same name `seed.py` uses for the local admin record)

The API validates JWTs from Keycloak. On the first authenticated request, it links the Keycloak user id to the local row when the username matches.

## 4. Seed the database

```bash
python seed.py
```

This creates the SQLite schema, an `admin` user with the `ADMIN` role, and the sample catalogue. Safe to run again.

Shoppers and brand staff sign up through the app (or you add matching rows in SQLite and users in Keycloak).

## 5. Run the API and the storefront

In one terminal, from the project root with the virtual environment active:

```bash
uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```

In another:

```bash
npm run dev --prefix client
```

Open the shop at `http://localhost:5173`. The storefront calls `/api`, and Vite forwards that to the API. API docs are at `http://127.0.0.1:8000/docs`.

## 6. Run the tests

```bash
pytest -q
```

Tests use an in-memory stand-in for object storage, so they do not need S3 or MinIO.

## Notes

- `.env.example` is committed. `.env`, the virtual environment, `client/node_modules`, and `ecommerce.db` stay out of git.
- Product image uploads need S3-compatible storage (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` in `.env`). Without that, catalogue browsing still works; uploads return unavailable.

## Common issues

### Login works but API calls return 401

The JWT user must exist in SQLite. Run `seed.py` for `admin`, or sign up through the shop. The username in Keycloak must match the local `users.username` row.

### The shop cannot reach the API

The storefront expects the API on `127.0.0.1:8000`. Leave `VITE_API_URL` unset for local development.
