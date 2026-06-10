-- Migration: Create profiles and bookmarks tables with RLS
-- This migration sets up the database schema for LinkNest

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Stores user profile information linked to Supabase Auth users
-- Each user has exactly one profile

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  handle text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint handle_format check (handle ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- Add index on handle for faster lookups
create index profiles_handle_idx on public.profiles(handle);

-- ============================================
-- BOOKMARKS TABLE
-- ============================================
-- Stores user bookmarks with visibility settings
-- Each bookmark belongs to a user and can be public or private

create table public.bookmarks (
  id uuid default gen_random_uuid() not null primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  url text not null,
  is_public boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint url_format check (url ~ '^https?://')
  -- Note: This is basic URL format validation that checks for http:// or https:// prefix
  -- It does not validate the full URL structure, which should be done at the application level
);

-- Add indexes for common queries
create index bookmarks_user_id_idx on public.bookmarks(user_id);
create index bookmarks_is_public_idx on public.bookmarks(is_public);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- RLS ensures users can only access their own data
-- This is enforced at the database level, preventing unauthorized access
-- even if client-side code is bypassed

-- Enable RLS on profiles table
alter table public.profiles enable row level security;

-- Enable RLS on bookmarks table
alter table public.bookmarks enable row level security;

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Policy: Users can view their own profile
-- Purpose: Allows users to read their own profile data
-- Security: Uses auth.uid() to ensure only the authenticated user can access their profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Users can insert their own profile
-- Purpose: Allows users to create their profile during signup
-- Security: Ensures users can only create a profile for themselves (auth.uid() = id)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Policy: Users can update their own profile
-- Purpose: Allows users to update their profile information
-- Security: Ensures users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- PUBLIC PROFILES VIEW
-- ============================================
-- This view exposes only non-sensitive profile information for public access
-- Email addresses are protected from public view

create view public.profiles_public as
select 
  id,
  handle,
  created_at
from public.profiles;

-- Grant select on the view to public (authenticated users)
grant select on public.profiles_public to authenticated;
grant select on public.profiles_public to anon;

-- ============================================
-- BOOKMARKS RLS POLICIES
-- ============================================

-- Policy: Users can view their own bookmarks
-- Purpose: Allows users to see all their bookmarks (both public and private)
-- Security: Uses auth.uid() to ensure users only see their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- Policy: Public can view public bookmarks
-- Purpose: Allows unauthenticated users to view bookmarks marked as public
-- Security: Only allows viewing when is_public = true, no modification allowed
-- This enables the public profile pages to show shared bookmarks
create policy "Public can view public bookmarks"
  on public.bookmarks for select
  using (is_public = true);

-- Policy: Users can create their own bookmarks
-- Purpose: Allows users to add new bookmarks
-- Security: Ensures user_id matches auth.uid(), preventing users from creating bookmarks for others
create policy "Users can create own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks
-- Purpose: Allows users to edit their bookmarks
-- Security: Ensures users can only update bookmarks they own (auth.uid() = user_id)
create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
-- Purpose: Allows users to remove their bookmarks
-- Security: Ensures users can only delete bookmarks they own (auth.uid() = user_id)
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Handle uniqueness validation
-- ============================================
-- This function can be used in application code to check handle uniqueness
-- before attempting to create a user, providing better error messages

create or replace function public.is_handle_available(handle_param text)
returns boolean as $$
begin
  return not exists (
    select 1 from public.profiles 
    where handle = handle_param
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- FUNCTION: Get profile by handle
-- ============================================
-- Retrieves a profile by handle (used for public profile pages)
-- Returns null if handle doesn't exist

create or replace function public.get_profile_by_handle(handle_param text)
returns table (
  id uuid,
  email text,
  handle text,
  created_at timestamp with time zone
) as $$
begin
  return query
  select p.id, p.email, p.handle, p.created_at
  from public.profiles p
  where p.handle = handle_param;
end;
$$ language plpgsql security definer;

-- ============================================
-- FUNCTION: Get bookmarks by user
-- ============================================
-- Retrieves all bookmarks for a specific user (including private ones)
-- Used when a user views their own dashboard

create or replace function public.get_bookmarks_by_user(user_id_param uuid)
returns table (
  id uuid,
  user_id uuid,
  title text,
  url text,
  is_public boolean,
  created_at timestamp with time zone
) as $$
begin
  return query
  select b.id, b.user_id, b.title, b.url, b.is_public, b.created_at
  from public.bookmarks b
  where b.user_id = user_id_param
  order by b.created_at desc;
end;
$$ language plpgsql security definer;

-- ============================================
-- FUNCTION: Get public bookmarks by handle
-- ============================================
-- Retrieves only public bookmarks for a user's profile
-- Used when viewing a public profile page

create or replace function public.get_public_bookmarks_by_handle(handle_param text)
returns table (
  id uuid,
  user_id uuid,
  title text,
  url text,
  is_public boolean,
  created_at timestamp with time zone
) as $$
begin
  return query
  select b.id, b.user_id, b.title, b.url, b.is_public, b.created_at
  from public.bookmarks b
  inner join public.profiles p on b.user_id = p.id
  where p.handle = handle_param and b.is_public = true
  order by b.created_at desc;
end;
$$ language plpgsql security definer;
