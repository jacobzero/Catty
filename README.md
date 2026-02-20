# Catty 🐱

A simple web app that uses AI to suggest names for your cat based on an uploaded photo.

## Project Structure

- `frontend/` - The static HTML, CSS, and JS files for the UI.
- `backend/` - The Node.js server that handles the picture analysis via the Gemini API.

## How to Run

1. **Start the backend:**
   - cd into `backend/`
   - Run `npm install`
   - Copy `.env.example` to `.env.local` and add your Google AI Studio key (`GEMINI_API_KEY=your_key_here`)
   - Run `npm run start` (Starts on port 4000)

2. **Open the frontend:**
   - Open `frontend/index.html` in your web browser.
