#!/bin/bash

echo "🎌 Starting MIRAIWATCH Anime Recommendation System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found in backend directory"
    exit 1
fi

pip install -r requirements.txt

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../anime_recommend
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in anime_recommend directory"
    exit 1
fi

npm install

echo ""
echo "✅ Installation Complete!"
echo ""
echo "🚀 To start the application:"
echo "   1. Backend:  cd backend && python main.py"
echo "   2. Frontend: cd anime_recommend && npm run dev"
echo ""
echo "   Then open http://localhost:3000 in your browser"
