<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1I5G1J2XjW0T_OptUaMf2D2Rw2Em9I9N-

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables by creating a `.env.local` file (or configure them in your deployment platform) with the following:
   
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
3. Run the app:
   `npm run dev`
