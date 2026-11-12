begin;
create or replace function public.journey_guard_progress() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer; prev text; a jsonb; q jsonb; course jsonb; score integer; total integer; i integer; unlocked jsonb; begin
if current_setting('journey.importing',true)='yes' then return new; end if;
unlocked:=coalesce(old.data->'unlocked','["lesson-1"]');
for n in 2..11 loop
 prev:='lesson-'||(n-1);
 if old.data->'lessons' ? ('lesson-'||n) or (old.data->'lessons'->prev->>'status'='completed' and exists(select 1 from jsonb_array_elements(old.data->'attempts') x where x->>'lessonId'=prev and (x->>'total')::int>0 and (x->>'score')::numeric/(x->>'total')::numeric>=0.8)) then if not unlocked ? ('lesson-'||n) then unlocked:=unlocked||jsonb_build_array('lesson-'||n); end if; end if;
end loop;
for n in 2..11 loop
 if new.data->'lessons' ? ('lesson-'||n) and not old.data->'lessons' ? ('lesson-'||n) and not unlocked ? ('lesson-'||n) then raise exception '请先完成上一课并通过 80%% 测验'; end if;
end loop;
i:=0;
for a in select value from jsonb_array_elements(new.data->'attempts') loop
 if not exists(select 1 from jsonb_array_elements(old.data->'attempts') x where x->>'id'=a->>'id') then
 select data into course from public.journey_courses where id=a->>'lessonId';
 if course is not null then
 n:=(course->>'number')::int;
 if n>1 and not unlocked ? (a->>'lessonId') then raise exception '课程尚未解锁'; end if;
 score:=0;total:=jsonb_array_length(course->'questions');
 for q in select value from jsonb_array_elements(course->'questions') loop
 if a->'answers'->(q->>'id')=q->'correct' then score:=score+1; end if;
 end loop;
 a:=a||jsonb_build_object('score',score,'total',total,'questions',course->'questions');
 new.data:=jsonb_set(new.data,array['attempts',i::text],a);
 end if;
 end if;i:=i+1;
end loop;
new.data:=jsonb_set(new.data,'{unlocked}',unlocked);
return new;end$$;
revoke all on function public.journey_guard_progress() from public,anon,authenticated;
create trigger journey_guard_progress before update of data on public.journey_profiles for each row execute function public.journey_guard_progress();
create table public.journey_notifications(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,slot text not null,created_at timestamptz not null default now(),message text not null,unique(user_id,slot));
alter table public.journey_notifications enable row level security;
create policy own_notifications on public.journey_notifications for select to authenticated using((select auth.uid())=user_id);
revoke all on public.journey_notifications from anon,authenticated;
grant select on public.journey_notifications to authenticated;
create or replace function public.journey_reminders() returns jsonb language sql security invoker set search_path='' as $$select coalesce(jsonb_agg(x),'[]') from (select id,created_at,message from public.journey_notifications order by created_at desc limit 20) x$$;
revoke all on function public.journey_reminders() from public,anon;grant execute on function public.journey_reminders() to authenticated;
create schema if not exists journey_private;
revoke all on schema journey_private from public,anon,authenticated;
create function journey_private.schedule_reminders() returns void language plpgsql security definer set search_path='' as $$
declare p record;cfg jsonb;t timestamp;begin
for p in select user_id,data->'reminderConfig' as cfg from public.journey_profiles where data->'reminderConfig'->>'enabled'='true' loop
 cfg:=p.cfg;
 if not exists(select 1 from pg_timezone_names where name=cfg->>'timezone') then continue; end if;
 t:=now() at time zone (cfg->>'timezone');
 if cfg->'days' @> jsonb_build_array(extract(dow from t)::int) and to_char(t,'HH24:MI')>=cfg->>'time' then
 insert into public.journey_notifications(user_id,slot,message) values(p.user_id,to_char(t,'YYYY-MM-DD'),'到学习日语的时间了！用几分钟复习，继续你的日语之旅。') on conflict do nothing;
 end if;
end loop;end$$;
revoke all on function journey_private.schedule_reminders() from public,anon,authenticated;
create extension if not exists pg_cron;
select cron.schedule('journey-learning-reminders','* * * * *','select journey_private.schedule_reminders()');
create or replace function public.journey_save(next_data jsonb,expected_revision bigint,expected_user uuid,import_raw text default null,import_hash text default null) returns bigint language plpgsql security definer set search_path='' as $$
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
 perform set_config('journey.importing',case when import_raw is not null then 'yes' else 'no' end,true);
 update public.journey_profiles set data=next_data,revision=revision+1 where user_id=auth.uid() returning revision into r;
 return r;
end$$;

commit;
