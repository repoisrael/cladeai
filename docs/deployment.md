# Deployment

## Deploying to GitHub Pages

1. Ensure your `package.json` includes:
   ```json
   "homepage": "https://repoisrael.github.io/clade/",
   "scripts": {
     "predeploy": "bun run build",
     "deploy": "gh-pages -d dist"
   }
   ```
2. Install the `gh-pages` package:
   ```bash
   bun add -D gh-pages
   # or: npm install --save-dev gh-pages
   ```
3. Deploy:
   ```bash
   bun run deploy
   # or: npm run deploy
   ```
4. Your site will be live at:
   https://repoisrael.github.io/clade/

**Note:**
- Make sure your Vite config (`vite.config.ts`) has `base: "/clade/"`.
- In your React app, set `<BrowserRouter basename="/clade">`.
