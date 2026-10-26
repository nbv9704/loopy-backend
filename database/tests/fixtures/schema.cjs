const { readFileSync } = require('node:fs')
const path = require('node:path')

/** Full disposable public schema with minimal local auth; never loads environment credentials. */
async function prepareSchema(db) {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
  const root = path.join(__dirname, '../..')
  const plan = JSON.parse(readFileSync(path.join(root, 'migration-plan.json'), 'utf8'))
  for (const name of [...plan.bootstrap, ...plan.forward]) await db.exec(readFileSync(path.join(root, name), 'utf8'))
}
module.exports = { prepareSchema }
