-- This function is triggered when a new user signs up.
-- It automatically creates a corresponding row in the public.player_profiles table.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.player_profiles (id, first_name, last_name, category)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    'Categoría Inicial' -- Puedes establecer una categoría por defecto
  );
  return new;
end;
$$;

-- This trigger calls the function whenever a new user is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
