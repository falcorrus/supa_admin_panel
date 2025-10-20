<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Supabase Admin Panel

This is a React-based admin panel for managing your Supabase database.

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
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the environment variables in Vercel settings
4. Your app will be deployed automatically

## Troubleshooting

If you see an "invalid api" error, make sure:
1. Your Supabase project URL and Anon Key are correctly set in environment variables
2. The Supabase project is properly configured with required permissions
3. The `get_user_tables` RPC function is created in your Supabase SQL Editor