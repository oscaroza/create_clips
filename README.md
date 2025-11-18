# Creavid – Create Clips

Une application web complète pour extraire automatiquement des passages viraux d'une vidéo longue (YouTube ou fichier local), générer les sous-titres, superposer une vidéo de fond, formater le rendu en 9:16 et exporter plusieurs clips prêts à poster sur TikTok, Reels ou Shorts.

## Fonctionnalités principales

- Téléchargement de la vidéo source depuis YouTube (`yt_dlp`) ou envoi d'un fichier local.
- Détection d'extraits soit via l'analyse d'énergie audio, soit via un découpage régulier.
- Génération des sous-titres en local avec Whisper et export `.srt`.
- Ajout de vidéos de fond boucle (GTA, ASMR, etc.) + fusion verticale 9:16 via MoviePy/FFmpeg.
- Gestion de jobs asynchrones avec suivi d'état et téléchargement des rendus.

## Architecture

```
create-clips/
├── backend/         # API FastAPI + pipeline vidéo (yt_dlp, whisper, moviepy)
├── frontend/        # Vite + React + TypeScript – interface opérateur
├── shared/          # Configuration commune (CLI utils, presets de backgrounds)
└── data/            # Stockage des entrées/sorties (gitignored)
```

### Backend

- **FastAPI** expose :
  - `POST /jobs` : crée un job (YouTube ou upload local) et lance le pipeline.
  - `GET /jobs/{id}` : retourne l'état, la progression et les clips générés.
  - `GET /backgrounds` : liste les vidéos de fond disponibles.
- `JobManager` garde les états en mémoire et délègue un thread par job.
- Le pipeline se découpe en modules :
  - `downloader.py` : récupère la vidéo (YouTube ou copie vers `/data/raw`).
  - `clipper.py` : extrait les meilleurs passages (énergie audio + picking greedy) ou découpe fixe.
  - `subtitles.py` : génère les sous-titres via Whisper (configurable).
  - `compositor.py` : fusionne clip + background, recadre en 9:16 et incruste les sous-titres.
  - `exporter.py` : exporte plusieurs formats (TikTok/Reels/Shorts) en mp4 + srt.

### Frontend

- Interface React monopage (Vite + TS) :
  - Formulaire pour coller l'URL YouTube ou sélectionner un fichier.
  - Choix de la stratégie d'extraction et de la vidéo de fond.
  - Tableau de suivi des jobs avec progression temps réel (polling).
  - Boutons de téléchargement des exports et sous-titres.
- Code organisé avec `components/`, `lib/api.ts`, `hooks/useJobPolling.ts`.

## Lancer le projet

### Prérequis

- Python 3.11+, pip & virtualenv
- FFmpeg, ImageMagick et `yt-dlp` installés sur le poste
- Node 18+ pour lancer le front

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
```

### Endpoints utiles

- `GET /health` : ping serveur
- `GET /backgrounds` : presets de vidéos de fond
- `POST /jobs` : création d'un job depuis une URL YouTube
- `POST /jobs/upload` : job depuis un fichier uploadé
- `GET /jobs` : liste des jobs + sorties
- `GET /jobs/{id}` : détail complet
- `GET /media/...` : sert les fichiers générés (vidéos, srt)

## Tâches prochaines

- Persistance de l'historique des jobs (SQLite + SQLModel).
- File d'attente réelle (RQ/Celery) pour gérer plusieurs rendus en parallèle.
- WebSocket live log + intégration stockage objet (S3/Wasabi) pour les exports.
