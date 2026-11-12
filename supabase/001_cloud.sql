begin;
create table public.journey_profiles(user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null default '{"version":1,"lessons":{},"vocabulary":{},"hiragana":{},"attempts":[],"events":[],"sessions":[],"preferences":{"dark":false,"romaji":true,"reminder":true},"customLessons":[]}', revision bigint not null default 0);
create table public.journey_imports(hash text primary key,user_id uuid not null references auth.users(id) on delete cascade,raw text not null,imported_at timestamptz not null default now());
create table public.journey_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.journey_courses(id text primary key, data jsonb not null);
alter table public.journey_profiles enable row level security;
alter table public.journey_imports enable row level security;
alter table public.journey_admins enable row level security;
alter table public.journey_courses enable row level security;
create policy own_profile on public.journey_profiles for select to authenticated using(user_id=auth.uid());
create policy own_import on public.journey_imports for select to authenticated using(user_id=auth.uid());
revoke all on public.journey_profiles,public.journey_imports,public.journey_admins,public.journey_courses from anon,authenticated;
grant select on public.journey_profiles to authenticated;
create function public.is_admin() returns boolean language sql security definer stable set search_path='' as $$select exists(select 1 from public.journey_admins where user_id=auth.uid())$$;
create function public.journey_load() returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb; r bigint; courses jsonb;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'authentication_required'; end if;
 insert into public.journey_profiles(user_id) values(auth.uid()) on conflict do nothing;
 select data,revision into d,r from public.journey_profiles where user_id=auth.uid();
 select coalesce(jsonb_agg(data),'[]') into courses from public.journey_courses where public.is_admin() or data->>'status'='published' or (data->>'status'='scheduled' and (data->>'publishAt')::timestamptz<=now());
 return jsonb_build_object('data',d,'revision',r,'courses',courses);
end$$;
create function public.journey_save(next_data jsonb,expected_revision bigint,expected_user uuid,import_raw text default null,import_hash text default null) returns bigint language plpgsql security definer set search_path='' as $$
declare r bigint; owner_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'authentication_required'; end if;
 if auth.uid()<>expected_user then raise exception 'account_changed'; end if;
 if octet_length(next_data::text)>10000000 or next_data->>'version' is distinct from '1' or jsonb_typeof(next_data->'attempts') is distinct from 'array' or jsonb_typeof(next_data->'lessons') is distinct from 'object' then raise exception 'invalid_state'; end if;
 select revision into r from public.journey_profiles where user_id=auth.uid() for update;
 if r is null or r<>expected_revision then raise exception 'revision_conflict'; end if;
 if import_raw is not null then
  if import_hash is distinct from encode(sha256(convert_to(import_raw,'UTF8')),'hex') then raise exception 'invalid_import_hash'; end if;
  if exists(select 1 from public.journey_imports where hash=import_hash and user_id=auth.uid() and raw=import_raw) then return r; end if;
  insert into public.journey_imports(hash,user_id,raw) values(import_hash,auth.uid(),import_raw) on conflict do nothing;
  select user_id into owner_id from public.journey_imports where hash=import_hash;
  if owner_id<>auth.uid() then raise exception 'import_already_claimed'; end if;
  if exists(select 1 from public.journey_imports where hash=import_hash and raw<>import_raw) then raise exception 'import_conflict'; end if;
 end if;
 update public.journey_profiles set data=next_data,revision=revision+1 where user_id=auth.uid() returning revision into r;
 return r;
end$$;
create function public.journey_import_receipt(hash text) returns text language sql security definer set search_path='' as $$select raw from public.journey_imports where journey_imports.hash=$1 and user_id=auth.uid()$$;
create function public.journey_publish(lesson jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_admin() then raise exception 'admin_required'; end if;
 insert into public.journey_courses(id,data) values(lesson->>'id',lesson) on conflict(id) do update set data=excluded.data;
end$$;
create function public.delete_my_account() returns void language plpgsql security definer set search_path='' as $$begin if auth.uid() is null then raise exception 'authentication_required'; end if;delete from auth.users where id=auth.uid();end$$;
revoke all on function public.is_admin(),public.journey_load(),public.journey_save(jsonb,bigint,uuid,text,text),public.journey_import_receipt(text),public.journey_publish(jsonb),public.delete_my_account() from public,anon;
grant execute on function public.is_admin(),public.journey_load(),public.journey_save(jsonb,bigint,uuid,text,text),public.journey_import_receipt(text),public.journey_publish(jsonb),public.delete_my_account() to authenticated;
commit;
