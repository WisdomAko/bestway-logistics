# Bestway Logistics Production Starter

This is a production-oriented starter for a shipment tracking website.

## Stack
- Next.js
- Supabase (database + authentication)
- Tailwind CSS
- Shareable tracking URLs

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase URL and anon key.
5. Install dependencies: `npm install`
6. Start: `npm run dev`
7. Deploy to Vercel or another Next.js host.

## Admin
Create a user in Supabase Authentication. Add the user's UUID to `admin_users` using the SQL shown in the schema.

## Notes
This starter intentionally does not contain real carrier credentials. For real courier tracking, connect an authorized carrier API/server-side integration.
