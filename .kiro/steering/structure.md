# Project Structure

```
InteractiveInvestor/
├── _launch.bat              # Dev startup script: activates conda env, sets DATABASE_URL, opens Kiro
├── requirements.txt         # Conda explicit environment spec (not pip format)
├── commands.txt             # Scratch notes for useful CLI commands
│
├── data/                    # Source data files (e.g. portfolio history exports)
│   └── History.xlsx
│
├── env/                     # Conda environment (local only, not committed)
│
├── jupyter/                 # Jupyter notebooks for data exploration
│   ├── test.ipynb           # Sandbox notebook for testing pandas/numpy
│   └── import.ipnyb         # Data import/transformation experiments
│
└── web/                     # Django project root (run manage.py from here)
    ├── manage.py
    ├── db.sqlite3            # SQLite file (dev fallback; PostgreSQL used in practice)
    │
    ├── app/                  # Django project config package
    │   ├── settings.py
    │   ├── urls.py           # Root URL config — includes dashboard.urls at /dashboard/
    │   ├── wsgi.py
    │   └── asgi.py
    │
    └── dashboard/            # Main Django app — portfolio dashboard UI
        ├── models.py
        ├── views.py
        ├── urls.py
        ├── admin.py
        ├── apps.py
        └── migrations/
```

## Conventions

- All Django management commands run from `web/`, not the repo root.
- New Django apps are created inside `web/` and registered in `web/app/settings.py` under `INSTALLED_APPS`.
- App URLs are included in `web/app/urls.py` using `include()`.
- Jupyter notebooks in `jupyter/` are for exploration and prototyping; production data logic lives in Django models/views.
- Data exports from Interactive Investor (e.g. `.xlsx` files) are stored in `data/`.
- Never commit the `env/` directory or any file containing secrets (e.g. `DATABASE_URL` values).
