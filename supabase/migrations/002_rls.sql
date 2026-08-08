alter table public.private_users enable row level security;
alter table public.chat_room enable row level security;
alter table public.room_members enable row level security;
alter table public.private_sessions enable row level security;
alter table public.access_attempts enable row level security;
alter table public.messages enable row level security;

create policy "private users can read participants"
on public.private_users for select
using (public.current_private_user_id() is not null);

create policy "members can read room"
on public.chat_room for select
using (public.is_private_room_member(chat_room.id));

create policy "members can read room members"
on public.room_members for select
using (public.is_private_room_member(room_members.room_id));

create policy "members can read messages"
on public.messages for select
using (
  is_deleted = false
  and public.is_private_room_member(messages.room_id)
);

create policy "members can send messages"
on public.messages for insert
with check (
  sender_id = public.current_private_user_id()
  and public.is_private_room_member(messages.room_id)
  and public.is_room_member(messages.room_id, receiver_id)
);

create policy "members can update seen state"
on public.messages for update
using (
  public.is_private_room_member(messages.room_id)
)
with check (
  public.is_private_room_member(messages.room_id)
);

revoke all on public.private_sessions from anon, authenticated;
revoke all on public.access_attempts from anon, authenticated;
