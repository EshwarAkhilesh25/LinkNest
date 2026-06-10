# LinkNest

A modern link management platform built with Next.js 15, TypeScript, and Tailwind CSS. Users can create, manage, and share bookmarks with public profile pages.

## Project Overview

LinkNest is a bookmark management application that allows users to:
- Sign up with email, password, and a unique handle
- Create, edit, and delete bookmarks
- Mark bookmarks as public or private
- Share public bookmarks via a public profile page (`/handle`)
- Receive welcome emails upon registration

## Features

- **User Authentication**: Sign up and login with email/password using Supabase Auth
- **Bookmark Management**: Full CRUD operations for bookmarks
- **Public/Private Visibility**: Toggle bookmark visibility for sharing
- **Public Profile Pages**: Anyone can view a user's public bookmarks at `/handle`
- **Welcome Emails**: Automatic welcome email sent via Resend after signup
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Built-in dark mode using Tailwind CSS
- **Row Level Security**: Database-level security protecting user data

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase (PostgreSQL with RLS)
- **Email**: Resend API
- **Code Quality**: ESLint, Prettier

## Local Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Resend account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LinkNest
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Configuration (for emails)
RESEND_API_KEY=your_resend_api_key
```

4. Set up the database:
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `supabase/migrations/001_create_schema.sql`
- Paste and execute the SQL script
- Verify tables `profiles` and `bookmarks` are created
- Verify RLS policies are enabled

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |

**Note:** The `SUPABASE_SERVICE_ROLE_KEY` is intentionally not used in this application. All operations use the anon key with RLS policies for security.

## Database Setup

### Schema

The application uses two main tables:

**profiles**
- `id` (UUID, primary key, references auth.users)
- `email` (text)
- `handle` (text, unique)
- `created_at` (timestamp)

**bookmarks**
- `id` (UUID, primary key)
- `user_id` (UUID, references profiles.id)
- `title` (text)
- `url` (text)
- `is_public` (boolean)
- `created_at` (timestamp)

### Public View

A public view `profiles_public` is created to expose only `handle` and `created_at` from profiles, protecting email addresses from public access.

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only view/modify their own data
- Public visitors can only view public bookmarks
- Email addresses are protected via the public view

## Deployment Instructions

### Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (Vercel will run `npm run build` automatically)
5. Verify deployment and test functionality

See `docs/VERCEL_DEPLOYMENT.md` for detailed deployment checklist.

## Security Approach

### Authentication
- Supabase Auth handles user sessions via HTTP-only cookies
- Server actions use authenticated user's session for all operations
- User IDs are obtained from `auth.uid()`, not from client input

### Database Security
- Row Level Security (RLS) policies enforce ownership at database level
- Public view `profiles_public` protects email addresses
- All bookmark operations include explicit `user_id` checks (defense in depth)

### API Security
- No service-role keys used in application
- All operations use anon key with RLS policies
- Server actions validate all inputs before database operations

### Email Security
- Resend API key stored in environment variables
- Email failures don't block user registration (graceful degradation)
- No sensitive data in email content

### URL Security
- All bookmark links use `target="_blank"` and `rel="noopener noreferrer"`
- Prevents tabnabbing and other security issues

## AI Agent Mistake(s) Found and Fixed

### 1. Missing Ownership Checks in Update/Delete Operations

**Issue:** Initial implementation of `updateBookmark` and `deleteBookmark` only checked bookmark ID without verifying user ownership:
```typescript
// Before (insecure)
await supabase
  .from('bookmarks')
  .update(data)
  .eq('id', bookmarkId)
```

**Fix:** Added explicit `user_id` checks for defense in depth:
```typescript
// After (secure)
await supabase
  .from('bookmarks')
  .update(data)
  .eq('id', bookmarkId)
  .eq('user_id', user.id)
```

**Impact:** While RLS policies would still prevent unauthorized access, the explicit checks provide defense in depth and make the security model clearer to reviewers.

### 2. Missing Profile Creation During Signup

**Issue:** Initial signup implementation created the Supabase Auth user but didn't insert the handle into the profiles table, causing a data inconsistency.

**Fix:** Added profile insertion after user creation:
```typescript
if (authData.user) {
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      handle: data.handle,
    })
}
```

**Impact:** Ensures data consistency between auth.users and profiles tables. If profile creation fails, the user is deleted to maintain consistency.

### 3. Public Profile Data Exposure Risk

**Issue:** Initial implementation queried the full `profiles` table which could expose email addresses to public visitors.

**Fix:** Created a public view `profiles_public` that only exposes `handle` and `created_at`:
```sql
CREATE VIEW public.profiles_public AS
SELECT handle, created_at
FROM public.profiles;
```

**Impact:** Email addresses are now protected from public access while still allowing handle lookups for profile pages.

### 4. Unused Service Role Key in .env.example

**Issue:** `SUPABASE_SERVICE_ROLE_KEY` was included in `.env.example` but never used in the application, creating confusion and potential security risk.

**Fix:** Removed the unused variable from `.env.example` since all operations use the anon key with RLS policies.

**Impact:** Reduces confusion and prevents accidental use of service-role keys which could bypass RLS policies.

### 5. Invalid Signup Cleanup Logic

**Issue:** Initial signup implementation attempted to delete the auth user if profile insertion failed using `supabase.auth.admin.deleteUser()`. However, this requires the service role key, but the application uses the anon key. This caused the cleanup to fail silently with a permission error.

**Fix:** Removed the invalid cleanup logic. If profile insertion fails after auth user creation, the auth user remains in the `auth.users` table. This is acceptable for this application scale.

**Impact:** The application may have orphaned `auth.users` records without corresponding `profiles` records if profile insertion fails. This is acceptable for small-scale applications but should be addressed in production.

**Production-Grade Solution:**
For a production deployment, implement one of these solutions:

1. **Service Role Key Cleanup:** Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables and create an admin client for cleanup:
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
```

2. **Database Trigger:** Create a database trigger to automatically delete orphaned auth users:
```sql
CREATE OR REPLACE FUNCTION handle_profile_insertion_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- This would need to be called from application logic
  -- or use a more complex trigger system
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

3. **Scheduled Cleanup Job:** Implement a scheduled job to identify and clean up orphaned auth users:
```typescript
// Run daily via cron
const { data: orphanedUsers } = await supabaseAdmin
  .from('auth.users')
  .select('id')
  .not('id', 'in', `(select id from profiles)`)
```

## One Thing I Would Improve With More Time

**Implement Bookmark Categories/Tags**

Currently, bookmarks are stored as a flat list without organization. With more time, I would implement:

1. **Tag System**: Allow users to add tags to bookmarks for better organization
2. **Category Folders**: Group bookmarks into custom folders
3. **Search Functionality**: Add search/filter by title, URL, or tags
4. **Bulk Operations**: Allow selecting multiple bookmarks for bulk actions

This would significantly improve the user experience for users with many bookmarks and make the application more competitive with existing bookmarking tools.

## Testing

See `docs/BOOKMARK_CRUD_TESTING.md` for comprehensive testing instructions including:
- Bookmark CRUD operations
- RLS policy verification
- Public profile testing
- User ownership enforcement

## Documentation

- `docs/RLS_POLICIES.md` - Detailed RLS policy documentation
- `docs/TEST_CASES.md` - Manual test cases for RLS enforcement
- `docs/BOOKMARK_CRUD_TESTING.md` - Bookmark CRUD testing guide
- `docs/VERCEL_DEPLOYMENT.md` - Vercel deployment checklist

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.
