import Database from 'better-sqlite3';
try {
  const db = new Database('resort.db');
  console.log('Database connection successful');
  const row = db.prepare('SELECT 1 as result').get();
  console.log('Query successful:', row);
} catch (err) {
  console.error('Database connection failed:', err);
  process.exit(1);
}
