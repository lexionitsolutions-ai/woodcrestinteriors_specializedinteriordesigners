# Woodcrest Interiors

A production-oriented static React/Vite site for a premium wooden wall-panelling business, with a concealed two-person realtime chat powered by Supabase. The public website does not advertise private messaging. The ordinary word configured by `SECRET_TRIGGER_ID` opens a normal consultation modal; the contact number field is verified by a Supabase Edge Function.

## Stack

- React + Vite static frontend
- Supabase Postgres, Realtime, Storage and Edge Functions
- GitHub Pages deployment
- PWA manifest and public-only service-worker caching

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Run locally:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL files in this order:

```text
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_storage.sql
```

3. Insert exactly two participants:

```sql
insert into public.private_users (display_name) values ('User One'), ('User Two');
insert into public.room_members (room_id, user_id)
select '00000000-0000-4000-8000-000000000001', id from public.private_users;
```

4. Create salted SHA-256 hashes of each participant's secret credential plus the same salt. Set Edge Function secrets:

```bash
supabase secrets set PRIVATE_ACCESS_HASH=your_sha256_hash
supabase secrets set PRIVATE_ACCESS_HASH_USER_ONE=first_user_sha256_hash
supabase secrets set PRIVATE_ACCESS_HASH_USER_TWO=second_user_sha256_hash
supabase secrets set PRIVATE_ACCESS_SALT=your_random_salt
supabase secrets set DESTRUCTIVE_FAILED_LOGIN_MODE=false
supabase secrets set ALLOWED_ORIGIN=https://your-user.github.io
supabase secrets set WOODCREST_SERVICE_KEY=your_secret_key
```

5. Deploy functions:

```bash
supabase functions deploy private-access
supabase functions deploy clear-room
```

## Security Notes

- The hidden public trigger is visual concealment only, not security.
- The plaintext credential is never stored in frontend code.
- The frontend uses only `VITE_SUPABASE_ANON_KEY`; keep the Supabase secret/service key only in Edge Function secrets as `WOODCREST_SERVICE_KEY`.
- Chat access uses an in-memory bearer token returned by `private-access`. It is not persisted to localStorage, sessionStorage, cookies or IndexedDB.
- `PRIVATE_ACCESS_HASH_USER_ONE` authenticates the earliest created `private_users` row. `PRIVATE_ACCESS_HASH_USER_TWO` authenticates the second row. `PRIVATE_ACCESS_HASH` remains as a backwards-compatible single-user fallback.
- Refreshing or closing the chat returns to the public site and requires verification again.
- Storage bucket `private-chat-media` is private. Media is read through short-lived signed URLs.
- The service worker avoids caching Supabase, storage and function requests.
- `DESTRUCTIVE_FAILED_LOGIN_MODE=true` deletes messages, private media and active sessions after a failed verification that includes the expected flow header. This is intentionally dangerous and should remain `false` unless the operational risk is understood.
- Rate limiting blocks more than five access attempts per IP hash within ten minutes.

## GitHub Pages

1. Push this project to a GitHub repository.
2. Add repository secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

3. Enable Pages with GitHub Actions as the source.
4. Push to `main` or run the `Deploy GitHub Pages` workflow manually.

## Functional Checklist

- Public site loads as a normal Woodcrest Interiors website.
- Searching frontend source or bundle does not reveal the credential or service-role key.
- Hidden trigger opens a normal consultation form.
- Incorrect credential returns a generic response and follows `DESTRUCTIVE_FAILED_LOGIN_MODE`.
- Correct credential loads the chat.
- Lock, logout, browser back and refresh all require verification again.
- Send text, images, videos, audio files, documents and recorded voice notes.
- Media opens through signed URLs and is not publicly browsable.
- Clear Chat confirms first, then removes messages and associated stored media server-side.
- Realtime messages, typing and online presence update without refresh.
- Test responsive widths: 360, 390, 430, 768, 1024 and 1440 px.
