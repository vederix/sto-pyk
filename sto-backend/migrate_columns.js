const { Client } = require('pg');
require('dotenv').config({ path: './sto-backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to DB');

    await client.query(`
      ALTER TABLE tugas ADD COLUMN IF NOT EXISTS odp_id BIGINT;
      ALTER TABLE tugas ADD COLUMN IF NOT EXISTS broadcast_status VARCHAR(30) DEFAULT 'sent';
      ALTER TABLE tugas ADD COLUMN IF NOT EXISTS telegram_message_id VARCHAR(100);
      ALTER TABLE tugas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS auth_tokens (
        id BIGSERIAL PRIMARY KEY,
        token VARCHAR(100) UNIQUE NOT NULL,
        user_id BIGINT,
        tugas_id BIGINT,
        expired_at TIMESTAMP WITH TIME ZONE,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Columns added successfully to tugas table!');

    // Trigger schema cache reload in PostgREST
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✅ PostgREST schema reloaded!');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

migrate();

