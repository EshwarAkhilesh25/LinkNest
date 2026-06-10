# Supabase Setup Guide

This guide explains how to set up Supabase for LinkNest authentication.

## Creating a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or sign in to your existing account
3. Click "New Project"
4. Choose your organization (or create one)
5. Fill in the project details:
   - **Name**: LinkNest (or any name you prefer)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose a region closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
6. Click "Create new project"
7. Wait for the project to be provisioned (usually takes 1-2 minutes)

## Obtaining Project Credentials

Once your project is ready:

1. Navigate to your project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Select **API** from the settings menu

### Project URL
- Copy the **Project URL** from the "Project URL" field
- It looks like: `https://xxxxxxxxxxxxx.supabase.co`

### Anon Key
- Copy the **anon** key from the "Project API keys" section
- It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Important**: This is the public key that can be safely exposed in client-side code
- The `service_role` key should NEVER be used in client-side code

## Required Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Example:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYmNkZWZnaGlqa2xtbm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjM0NTY3ODksImV4cCI6MTkzOTAzMjc4OX0.example
```

## Database Schema Setup

For the LinkNest application, you'll need to create a `profiles` table to store user handles:

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click "New query"
4. Run the following SQL:

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  handle text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

Note: The handle field has a unique constraint, which ensures no two users can have the same handle. The signup action validates handle uniqueness before creating the user.

## Authentication Settings

1. Go to **Authentication** in the left sidebar
2. Click on **Providers**
3. Ensure **Email** provider is enabled
4. Configure email settings if needed (for production, you may want to use a custom SMTP server or Supabase's built-in email service)

## Testing Your Setup

After configuring the environment variables, you can test the connection by running:

```bash
npm run dev
```

Try signing up a new user to verify the authentication flow works correctly.

## Security Notes

- Never commit `.env.local` to version control
- The `anon` key is safe for client-side use but has limited permissions
- The `service_role` key should only be used on the server and never exposed to clients
- Row Level Security (RLS) policies are essential for protecting user data
