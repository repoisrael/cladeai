# Getting Started

## Prerequisites
- Node.js 18+
- Bun (optional) or npm/yarn
- Git

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/repoisrael/cladeai.git
   cd cladeai
   ```
2. Install dependencies:
   ```bash
   bun install
   # or: npm install
   ```

## Environment Variables
1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Fill in your values in `.env`:
   - Get Supabase keys from your Supabase dashboard.
   - Get Spotify keys from your Spotify Developer Dashboard.
   - For production:
     ```
     VITE_SPOTIFY_REDIRECT_URI=https://repoisrael.github.io/cladeai/callback/spotify
     ```
   - For local development:
     ```
     VITE_SPOTIFY_REDIRECT_URI=http://localhost:8080/spotify-callback
     ```
