const { readFileSync } = require('node:fs')
const path = require('node:path')
const migration = name => readFileSync(path.join(__dirname, '../../migrations', name), 'utf8')

async function preparePractice(db) {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
    CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql AS 'SELECT gen_random_uuid()';
    CREATE FUNCTION update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
    CREATE TABLE user_profiles(id uuid PRIMARY KEY REFERENCES auth.users(id), is_admin boolean DEFAULT false);
    CREATE TABLE languages(id text PRIMARY KEY);
    CREATE TABLE chapters(id uuid PRIMARY KEY, language_id text);
    CREATE TABLE lessons(id uuid PRIMARY KEY, chapter_id uuid, status text);
    CREATE TABLE user_progress(user_id uuid, lesson_id uuid, status text);
    CREATE TABLE pvp_matches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_ids uuid[] NOT NULL);
    INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
    INSERT INTO user_profiles(id) SELECT id FROM auth.users;
  `)
  await db.exec(migration('027-practice-sets.sql'))
  await db.exec(migration('030-practice-sets-official-visibility.sql'))
  await db.exec(migration('044-atomic-practice.sql'))
}
module.exports = { preparePractice, migration }
