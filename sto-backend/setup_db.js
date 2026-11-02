const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = 'postgresql://postgres.glxnrnznboejcdknosgd:ozCVEbtjUzUJ24GF@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Menghubungkan ke Supabase Postgres via Session Pooler...');
    await client.connect();
    console.log('✅ Berhasil terhubung ke database Supabase!');

    const schemaPath = path.resolve(__dirname, '..', 'supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Mengeksekusi skema supabase_schema.sql...');
    await client.query(sql);
    console.log('✅ Seluruh tabel dan skema berhasil dibuat di Supabase!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Daftar tabel yang aktif di database:');
    res.rows.forEach(r => console.log('  ✔ ' + r.table_name));

    const userCount = await client.query('SELECT count(*) FROM users;');
    console.log(`\n👥 Total pengguna default yang siap digunakan: ${userCount.rows[0].count}`);

  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err);
  } finally {
    await client.end();
  }
}

run();
