-- Initial schema: profiles + favorites (titles, countries, providers)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table favorite_titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  release_year integer,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create table favorite_countries (
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, country_code)
);

create table favorite_providers (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id integer not null,
  provider_name text not null,
  logo_path text,
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id)
);

alter table profiles enable row level security;
alter table favorite_titles enable row level security;
alter table favorite_countries enable row level security;
alter table favorite_providers enable row level security;

-- profiles
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on profiles for delete using (auth.uid() = id);

-- favorite_titles
create policy "favorite_titles_select_own" on favorite_titles for select using (auth.uid() = user_id);
create policy "favorite_titles_insert_own" on favorite_titles for insert with check (auth.uid() = user_id);
create policy "favorite_titles_update_own" on favorite_titles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorite_titles_delete_own" on favorite_titles for delete using (auth.uid() = user_id);

-- favorite_countries
create policy "favorite_countries_select_own" on favorite_countries for select using (auth.uid() = user_id);
create policy "favorite_countries_insert_own" on favorite_countries for insert with check (auth.uid() = user_id);
create policy "favorite_countries_update_own" on favorite_countries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorite_countries_delete_own" on favorite_countries for delete using (auth.uid() = user_id);

-- favorite_providers
create policy "favorite_providers_select_own" on favorite_providers for select using (auth.uid() = user_id);
create policy "favorite_providers_insert_own" on favorite_providers for insert with check (auth.uid() = user_id);
create policy "favorite_providers_update_own" on favorite_providers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorite_providers_delete_own" on favorite_providers for delete using (auth.uid() = user_id);
