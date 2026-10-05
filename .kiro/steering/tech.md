# Tech Stack

## Language & Runtime
- Python 3.14 (managed via Conda)

## Web Framework
- Django 6.0.8
- Project config package: `app` (inside `web/`)
- Database abstraction: `dj_database_url` for parsing `DATABASE_URL` env var

## Database
- PostgreSQL (primary) — connection string set via `DATABASE_URL` environment variable
- SQLite (`web/db.sqlite3`) present for local fallback/dev use

## Data & Analysis
- pandas 3.0.6
- NumPy 2.5.3
- Jupyter notebooks for exploratory data work before wiring into Django

## Environment Management
- Conda environment stored in `env/` (local, not committed)
- `requirements.txt` is a conda explicit spec file (not pip format)

## Common Commands

```bash
# Activate the conda environment (run from repo root)
conda activate ./env

# Start the development server (run from web/)
python manage.py runserver

# Create/apply database migrations (run from web/)
python manage.py makemigrations
python manage.py migrate

# Create a new Django app (run from web/)
python manage.py startapp <appname>
```

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgres://postgres:postgres@localhost:5432/interactive_investor?sslmode=disable` |

## Launch Script
`_launch.bat` activates the conda env, sets `DATABASE_URL`, and opens Kiro. Use it as the standard dev startup script on Windows.
