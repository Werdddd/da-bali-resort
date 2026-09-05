import Database from 'better-sqlite3';
const db = new Database('resort.db');
const info = db.prepare(`
  UPDATE rooms 
  SET name = 'Bubu Room Suite A', 
      type = 'Family Suite', 
      description = 'Spacious family room with breakfast included. Ideal for large groups.', 
      price = 6950, 
      capacity = 8, 
      beds = 'Double Bed', 
      image_url = '/src/bubu-cover.jpg', 
      images = '["/src/bubu-cover.jpg","https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]', 
      status = 'available' 
  WHERE id = 5
`).run();
console.log(`Row(s) updated: ${info.changes}`);
db.close();
