import Database from 'better-sqlite3';

const db = new Database('resort.db');
const allAmenityBookings = db.prepare(`
  SELECT ab.id, ab.user_id, u.first_name, u.last_name 
  FROM amenity_bookings ab 
  JOIN users u ON ab.user_id = u.id 
`).all();

console.log("All amenity bookings:", allAmenityBookings);
