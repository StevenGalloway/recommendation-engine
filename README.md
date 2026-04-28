# ANIMATCH

A full-stack anime recommendation engine built with FastAPI and Next.js. Enter a title, genre, or type and get ranked recommendations using TF-IDF vectorization and cosine similarity on a catalog of 391 titles.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)

---

## Screenshots

| Home | Results |
|------|---------|
| ![Home](./screenshots/home.png) | ![Results](./screenshots/results.png) |

---

## How It Works

The recommendation engine is content-based, not collaborative. No user history is required.

1. **Vectorization** - Each anime entry is represented as a TF-IDF vector built from its genre tags and type (e.g. `"Action Adventure Shounen TV"`).
2. **Similarity search** - When a query matches a known title, the engine computes cosine similarity between that title's vector and every other entry in the corpus. Results are ranked by score.
3. **Fallback** - If no title match is found, the query is treated as a genre or type filter. If that also returns nothing, the system calls the [Jikan API](https://jikan.moe/) to fetch metadata for the query and runs the same cosine similarity pass against the local corpus.
4. **Images** - Cover art is fetched client-side from the Jikan API, loading progressively as results render.

---

## Tech Stack

**Backend**
- FastAPI + Uvicorn
- pandas for dataset loading and filtering
- scikit-learn for TF-IDF and cosine similarity
- httpx for async Jikan API fallback calls
- pydantic for request/response validation

**Frontend**
- Next.js 16 (App Router)
- TypeScript throughout
- Tailwind CSS v4
- No component library - all UI is hand-built

---

## Features

- Search by anime title, genre, or content type
- Clickable genre chips for one-tap queries
- Random genre discovery ("Surprise Me")
- Client-side type filter (TV / Movie / OVA / Special)
- Client-side sort by match score, rating, or popularity
- Favorites saved to localStorage, filterable as "My List"
- Expandable cards showing full metadata
- Cosine similarity score displayed as a progress bar per result
- Progressive image loading with graceful fallback placeholders

---

## Project Structure

```
animatch/
├── backend/
│   ├── data/
│   │   └── generate_dataset.py    # generates anime.csv + rating.csv
│   ├── main.py                    # FastAPI app, recommendation logic
│   ├── schema.py                  # pydantic models
│   └── requirements.txt
└── anime_recommend/               # Next.js frontend
    ├── app/
    │   ├── page.tsx               # main UI, all client state
    │   ├── layout.tsx
    │   └── globals.css
    ├── lib/
    │   ├── api.ts                 # fetch wrappers
    │   └── types.ts
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

### Setup

```bash
# 1. Generate the dataset
cd backend/data
python generate_dataset.py

# 2. Install backend dependencies
cd ..
pip install -r requirements.txt

# 3. Install frontend dependencies
cd ../anime_recommend
npm install
```

### Run

Open two terminals.

```bash
# Terminal 1 - backend
cd backend
python main.py
# API running at http://localhost:8000
```

```bash
# Terminal 2 - frontend
cd anime_recommend
npm run dev
# App running at http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/recommend` | Get recommendations for a query |
| `GET` | `/anime/{id}` | Fetch a single anime by ID |
| `GET` | `/genres` | List all genres in the dataset |

**POST /recommend**
```json
{
  "query": "Attack on Titan",
  "limit": 10
}
```

Response includes `anime_id`, `name`, `genre`, `type`, `episodes`, `rating`, `members`, and `similarity_score`.

---

## Dataset

The dataset is generated locally via `backend/data/generate_dataset.py` (391 titles, excluded from version control). It covers titles from 1990 to 2024 across TV, Movie, OVA, and Special formats with genre tags sourced from MyAnimeList classifications.

To swap in the full MyAnimeList dataset (12,000+ titles), download `anime.csv` from [Kaggle](https://www.kaggle.com/datasets/CooperUnion/anime-recommendations-database) and place it in `backend/data/`. No code changes needed.

---

## License

MIT
