
# Supabase Admin Panel

Это админ-панель на базе React для управления моей Supabase

*This is a React-based admin panel for managing your Supabase database.*

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables by creating a `.env.local` file (or configure them in your deployment platform) with the following:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Optional: for accessing metadata without RPC function
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **ВАЖНО: Использование VITE_SUPABASE_SERVICE_ROLE_KEY в клиентском приложении небезопасно и рекомендуется только для локальной разработки.**
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
3. When using service role key, ensure it has the necessary permissions