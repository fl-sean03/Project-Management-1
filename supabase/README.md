# Supabase Database Setup for Zyra Project Management App

This directory contains the database setup files for the Zyra project management application using Supabase and DigitalOcean Spaces for file storage.

## Directory Structure

- `migrations/`: Contains SQL migration files for creating database tables and more
  - `01_create_tables.sql`: Creates all tables with proper relationships
  - `02_enable_rls.sql`: Sets up Row Level Security policies for all tables
  - `03_functions_triggers.sql`: Sets up database functions and triggers
- `seed.sql`: Contains initial data to seed the database with

## Setting Up Supabase

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in
2. Create a new project
3. Note your project URL and API keys (anon key and service role key)

### 2. Run Migrations

You can run these migrations manually in the Supabase SQL editor or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-reference-id>

# Run migrations
supabase db push
```

### 3. Set Up Environment Variables

Create a `.env.local` file at the root of your project with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# DigitalOcean Spaces Configuration
SPACES_REGION=nyc3  # or your chosen region
SPACES_NAME=zyra-files  # your space name
SPACES_KEY=your-spaces-access-key
SPACES_SECRET=your-spaces-secret-key
```

### 4. Set Up DigitalOcean Spaces

1. Create a DigitalOcean account if you don't have one
2. Navigate to "Spaces" and create a new Space
3. Generate API keys for Spaces access
4. Configure CORS for your Space:
   - Set Origin: `https://your-app-domain.com` (use `*` for development)
   - Allowed Methods: `GET,PUT,POST,DELETE`
   - Allowed Headers: `Authorization,Content-Type,Accept,Origin,User-Agent`

## Database Schema

### Tables

- `users`: User accounts and profiles
- `projects`: Project information
- `project_members`: Junction table for project team members
- `tasks`: Tasks within projects
- `files`: Files uploaded to projects (metadata only)
- `activities`: Activity logs
- `notifications`: User notifications
- `comments`: Comments on tasks

### Row Level Security

All tables have Row Level Security enabled with appropriate policies to ensure users can only access data they are authorized to see.

## Testing

You can test the setup by:

1. Running your application locally
2. Navigating to a project's file section
3. Uploading a file to verify both Supabase and DigitalOcean Spaces integration is working

## Troubleshooting

If you encounter issues:

1. Check your environment variables are correctly set
2. Verify CORS is properly configured in your DigitalOcean Space
3. Ensure the Supabase service role key has the necessary permissions
4. Check the browser console and server logs for errors 