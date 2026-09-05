import Database from 'better-sqlite3';

const db = new Database('resort.db');
db.prepare("DELETE FROM payments WHERE booking_id = 1").run();
db.prepare("DELETE FROM automated_messages WHERE booking_id = 1").run();
db.prepare("DELETE FROM bookings WHERE id = 1").run();
console.log("Booking #1 and its dependencies deleted.");
