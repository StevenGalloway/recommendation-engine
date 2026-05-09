# ANIMATCH - Quick Start Guide

## What's Been Created

✅ **Backend API** (`backend/main.py`)
- FastAPI server with anime recommendation engine
- Content-based filtering using TF-IDF and cosine similarity
- Support for name, genre, and type searches
- CORS enabled for frontend communication

✅ **Frontend UI** (`anime_recommend/app/page.tsx`)
- Beautiful ANIMATCH design
- Real-time search with loading states
- Grid display of recommendations with ratings
- Responsive design for all devices

✅ **API Integration** (`anime_recommend/lib/api.ts`)
- Type-safe API calls
- Error handling
- Environment configuration

## 🚀 How to Run

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- fastapi
- uvicorn
- pandas
- numpy
- scikit-learn
- pydantic

### Step 2: Start Backend Server

```bash
cd backend
python main.py
```

Server will run at: `http://localhost:8000`

You can test it by visiting: `http://localhost:8000` (should show API status)

### Step 3: Install Frontend Dependencies

Open a NEW terminal:

```bash
cd anime_recommend
npm install
```

### Step 4: Start Frontend Server

```bash
cd anime_recommend
npm run dev
```

Frontend will run at: `http://localhost:3000`

## 🎯 Testing the Application

1. Open `http://localhost:3000` in your browser
2. Try these searches:
   - **"Naruto"** - Get shows similar to Naruto
   - **"Action"** - Get all action anime
   - **"Movie"** - Get anime movies
   - **"Romance Sci-Fi"** - Get romance sci-fi shows

## 📋 API Endpoints

### Test in Browser or Postman:

**Get Recommendations:**
```
POST http://localhost:8000/recommend
Body: {"query": "Naruto", "limit": 10}
```

**Get Genres:**
```
GET http://localhost:8000/genres
```

**Get Anime Details:**
```
GET http://localhost:8000/anime/32281
```

## 🎨 Features Implemented

### Frontend
- ✅ ANIMATCH branded header with gradient
- ✅ Anime-themed background with overlay
- ✅ Search input with real-time validation
- ✅ Loading spinner during searches
- ✅ Error handling with user-friendly messages
- ✅ Grid layout for recommendations
- ✅ Anime cards with:
  - Title
  - Rating (with star icon)
  - Type (TV, Movie, OVA)
  - Episode count
  - Genres
  - Member count
- ✅ Hover effects and animations
- ✅ Responsive design

### Backend
- ✅ Content-based recommendation algorithm
- ✅ TF-IDF vectorization for text analysis
- ✅ Cosine similarity for recommendations
- ✅ Name-based search with similarity scoring
- ✅ Genre-based filtering
- ✅ Type-based filtering
- ✅ Rating and popularity sorting
- ✅ CORS configuration for frontend
- ✅ Input validation
- ✅ Error handling

## 🔧 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Install dependencies: `pip install -r requirements.txt`
- Check if port 8000 is available

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port 3000 is available

### "Failed to fetch" error
- Make sure backend is running on port 8000
- Check backend terminal for errors
- Verify CORS is configured correctly

### No recommendations found
- Try different search terms
- Check that CSV files exist in `backend/data/`
- Verify anime.csv has data

## 📊 Dataset Info

The system uses MyAnimeList data with:
- **12,294 anime titles**
- **Genres**: Action, Adventure, Comedy, Drama, Fantasy, etc.
- **Types**: TV, Movie, OVA, Special, ONA
- **Ratings**: 1-10 scale
- **Members**: Popularity metric

## 🎓 How It Works

1. **User enters query** → Frontend sends POST request to backend
2. **Backend processes query** → Searches anime by name/genre/type
3. **Recommendation engine** → Uses TF-IDF + cosine similarity
4. **Results ranked** → By similarity score and rating
5. **Frontend displays** → Cards with anime details

## 🎉 Next Steps

You can enhance the app with:
- User authentication
- Save favorite anime
- Watch list functionality
- More advanced recommendation algorithms
- Integration with anime APIs for images
- User ratings and reviews
- Social features (share recommendations)

Enjoy ANIMATCH! 🎌
