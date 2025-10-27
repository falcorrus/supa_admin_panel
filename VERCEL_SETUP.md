# Vercel Environment Variables Setup

To deploy this application on Vercel, you need to set the following environment variables in your Vercel project settings:

## Required Environment Variables

1. `VITE_SUPABASE_URL` - Your Supabase project URL
   - Example: https://your-project.supabase.co

2. `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - This is found in your Supabase project settings under "API"

3. `VITE_GEMINI_API_KEY` - Your Google Gemini API key (if needed)

## Optional Environment Variables

4. `VITE_SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - This is found in your Supabase project settings under "API"
   - **WARNING**: Using service_role_key in client-side applications is unsafe and should be avoided in production
   - This variable is optional and only needed if you want to access metadata directly (without using RPC function)

## How to set up in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with its corresponding value
5. Redeploy your project to apply the changes

## Security Considerations

When deploying to production:

1. Avoid using `VITE_SUPABASE_SERVICE_ROLE_KEY` in production environment
2. Instead, use the RPC function approach for accessing metadata
3. Make sure to properly configure Row Level Security (RLS) policies in your Supabase project
4. Review and limit database permissions to only what's necessary for your application

Note: These variables will be injected at build time and made available to your client-side code through `import.meta.env`.