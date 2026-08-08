create extension if not exists pgcrypto;

create table if not exists public.private_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create table if not exists public.chat_room (
  id uuid primary key default '00000000-0000-4000-8000-000000000001',
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.chat_room(id) on delete cascade,
  user_id uuid not null references public.private_users(id) on delete cascade,
  primary key (room_id, user_id)
);

create table if not exists public.private_sessions (
  token_hash text primary key,
  user_id uuid not null references public.private_users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.access_attempts (
  id bigserial primary key,
  ip_hash text not null,
  flow_id text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_room(id) on delete cascade,
  sender_id uuid not null references public.private_users(id) on delete restrict,
  receiver_id uuid not null references public.private_users(id) on delete restrict,
  message_type text not null check (message_type in ('text', 'image', 'video', 'audio', 'file')),
  text_content text,
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  duration numeric,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  seen_at timestamptz,
  reply_to_id uuid references public.messages(id) on delete set null,
  is_deleted boolean not null default false
);

create index if not exists messages_created_at_idx on public.messages(created_at);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at);
create index if not exists private_sessions_user_idx on public.private_sessions(user_id, expires_at);
create index if not exists access_attempts_ip_created_idx on public.access_attempts(ip_hash, created_at);

insert into public.chat_room(id) values ('00000000-0000-4000-8000-000000000001') on conflict do nothing;

create or replace function public.current_private_user_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  bearer text;
  hash text;
  found_user uuid;
begin
  bearer := nullif(current_setting('request.headers', true)::json->>'x-private-token', '');
  if bearer is null then
    return null;
  end if;
  hash := encode(digest(bearer, 'sha256'), 'hex');
  select user_id into found_user
  from public.private_sessions
  where token_hash = hash and revoked_at is null and expires_at > now()
  limit 1;
  return found_user;
exception when others then
  return null;
end;
$$;

create or replace function public.is_private_room_member(room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = room
      and user_id = public.current_private_user_id()
  );
$$;

create or replace function public.is_room_member(room uuid, member uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = room
      and user_id = member
  );
$$;
