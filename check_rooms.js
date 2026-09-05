import Database from 'better-sqlite3';
const db = new Database('resort.db');
const rooms = db.prepare("SELECT * FROM rooms").all();
console.log(rooms);
db.close();
