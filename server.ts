import express from "express";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { format, addDays, subDays, isSameDay, parseISO, differenceInDays, startOfMonth, addMonths, subMonths } from "date-fns";
import nodemailer from "nodemailer";
import cors from "cors";
import fs from "fs";
import { generateInvoicePdf } from "./pdf-invoice";
import { calculateAmenityItemsTotal, isCottageSelection } from "./src/amenityOptions";

// --- IN-MEMORY LOGGER FOR DEBUGGING ---
const debugLogs: string[] = [];
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  const msg = `[LOG] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  debugLogs.push(msg);
  if (debugLogs.length > 500) debugLogs.shift();
  originalLog(...args);
};
console.warn = (...args) => {
  const msg = `[WARN] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  debugLogs.push(msg);
  if (debugLogs.length > 500) debugLogs.shift();
  originalWarn(...args);
};
console.error = (...args) => {
  const msg = `[ERROR] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  debugLogs.push(msg);
  if (debugLogs.length > 500) debugLogs.shift();
  originalError(...args);
};
// --------------------------------------

// Fix for production bundling issue where import.meta.url can be undefined
let __dirname;
try {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  __dirname = process.cwd();
}

let db: Database.Database;

function connectDatabase() {
  const dbPath = "resort.db";
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;

  const tryConnect = () => {
    const database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    // Test the connection
    database.prepare("SELECT 1").get();
    return database;
  };

  try {
    return tryConnect();
  } catch (err: any) {
    console.error("Database connection error:", err);
    if (err.code === 'SQLITE_CORRUPT' || err.message?.includes('malformed')) {
      console.error("Database appears corrupted. Backing up and recreating.");
      const timestamp = Date.now();
      try {
        fs.renameSync(dbPath, `${dbPath}.corrupt.${timestamp}`);
        if (fs.existsSync(walPath)) fs.renameSync(walPath, `${walPath}.corrupt.${timestamp}`);
        if (fs.existsSync(shmPath)) fs.renameSync(shmPath, `${shmPath}.corrupt.${timestamp}`);
      } catch (e) {
        console.error("Failed to backup corrupted database files:", e);
      }
      return tryConnect();
    }
    throw err;
  }

}

db = connectDatabase();

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

// Initialize WebSocket
let wss: WebSocketServer;

const broadcast = (data: any) => {
  if (!wss) return;
  try {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (sendError) {
          console.error("WebSocket send error:", sendError);
        }
      }
    });
  } catch (e) {
    console.error("Broadcast error:", e);
  }
};

// CSV export helpers
const csvCell = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (headers: string[], rows: any[][]): string => {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
};

// Email Service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

// A room can only be reserved while its housekeeping status is 'available'; this message
// explains why to whoever tried (guest checkout form or front-desk walk-in form).
function roomUnavailableMessage(status: string): string {
  if (status === 'dirty') return "This room is being turned over by housekeeping and isn't ready for a new guest yet.";
  if (status === 'in_progress') return "This room is currently being cleaned and isn't ready for a new guest yet.";
  if (status === 'maintenance') return "This room is under maintenance and is not available for booking.";
  if (status === 'occupied') return "This room is currently occupied.";
  return "This room is not currently available for booking.";
}

const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return;
    }
    await transporter.sendMail({
      from: `"Da Bali Resort" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

// Initialize Database
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      first_name TEXT,
      last_name TEXT,
      contact_no TEXT,
      address TEXT,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'guest',
      schedule TEXT,
      status TEXT DEFAULT 'active'
    );
  `);

try {
  db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
} catch (e) {
  // Column might already exist
}

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    description TEXT,
    price REAL,
    capacity INTEGER,
    beds TEXT,
    image_url TEXT,
    images TEXT,
    status TEXT DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    room_id INTEGER,
    check_in TEXT,
    check_out TEXT,
    total_price REAL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    qr_code TEXT,
    guests_count INTEGER DEFAULT 1,
    extra_bed INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    images TEXT,
    price REAL DEFAULT 0,
    stock INTEGER,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS amenity_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amenity_id INTEGER,
    reservation_date TEXT,
    reservation_time TEXT,
    pax_count INTEGER,
    details TEXT,
    status TEXT DEFAULT 'pending',
    total_price REAL DEFAULT 0,
    deposit_amount REAL DEFAULT 0,
    balance_amount REAL DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    stock_decremented INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(amenity_id) REFERENCES amenities(id)
  );

  CREATE TABLE IF NOT EXISTS hero_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    type TEXT,
    is_active INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Ensure guests_count, extra_bed, and proof_of_payment exist in bookings
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN guests_count INTEGER DEFAULT 1").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN extra_bed INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN proof_of_payment TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN proof_of_payment TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN payment_method TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN transaction_reference TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN amount_paid REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN transaction_reference TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN amount_paid REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN schedule TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN position TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE rooms ADD COLUMN last_cleaned_at TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE rooms ADD COLUMN housekeeping_notes TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE bookings ADD COLUMN admin_notes TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN is_archived INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN is_archived INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN reset_token TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER").run();
} catch (e) {}

// Seed hero_banners table with placeholder content if empty
function seedHeroBanners() {
  const bannerCount = db.prepare("SELECT COUNT(*) as count FROM hero_banners").get() as { count: number };
  if (bannerCount.count === 0) {
    const placeholderBanners = [
      {
        title: "WELCOME",
        description: "DA BALI RESORT",
        image_url: "/src/476799607_640944451796572_5504544646714415496_n-1.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 0
      },
      {
        title: "INFINITY POOL",
        description: "Relax in our flowing spring water infinity pool, where the horizon is yours to keep.",
        image_url: "/src/Infinity Pool-1.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 1
      },
      {
        title: "FINE DINING",
        description: "Experience the art of culinary excellence with exquisite flavors and impeccable service.",
        image_url: "/src/Fine Dining.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 2
      },
      {
        title: "PAVILION",
        description: "A versatile Balinese-inspired function hall perfect for hosting memorable weddings, corporate events, and elegant celebrations.",
        image_url: "/src/Pavilion.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 3
      },
      {
        title: "COLORED TENT/TEAM BUILDING",
        description: "Create lasting memories in our vibrant outdoor event space, thoughtfully designed to foster connection and joy during your group's team-building getaway.",
        image_url: "/src/Colored Tent.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 4
      },
      {
        title: "SALAKOT ROOM",
        description: "Experience the perfect blend of traditional Filipino architecture and modern comfort in our uniquely designed Salakot-themed villas.",
        image_url: "/src/salakot-cover.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 5
      },
      {
        title: "BUBU ROOM",
        description: "Experience ultimate comfort in our spacious Bubu Room, a thoughtfully designed family suite that provides a warm and relaxing sanctuary for your loved ones.",
        image_url: "/src/bubu-cover.jpg",
        link_url: "",
        type: "",
        is_active: 1,
        order_index: 6
      }
    ];

    const insertBanner = db.prepare(`
      INSERT INTO hero_banners (title, description, image_url, link_url, type, is_active, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    placeholderBanners.forEach(banner => {
      insertBanner.run(banner.title, banner.description, banner.image_url, banner.link_url, banner.type, banner.is_active, banner.order_index);
    });
  }
}
seedHeroBanners();


// Add walk-in support columns to bookings
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN first_name TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN last_name TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN email TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN contact_no TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN proof_of_payment TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN amount_paid REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN transaction_reference TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN deposit_amount REAL DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN balance_amount REAL DEFAULT 0").run();
} catch (e) {}

try { db.prepare("ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'Pending'").run(); } catch(e){}
try { db.prepare("ALTER TABLE bookings ADD COLUMN balance_proof_of_payment TEXT").run(); } catch(e){}
try { db.prepare("ALTER TABLE bookings ADD COLUMN balance_transaction_reference TEXT").run(); } catch(e){}
try { db.prepare("ALTER TABLE bookings ADD COLUMN balance_amount_paid REAL DEFAULT 0").run(); } catch(e){}

try { db.prepare("ALTER TABLE amenity_bookings ADD COLUMN payment_status TEXT DEFAULT 'Pending'").run(); } catch(e){}
try { db.prepare("ALTER TABLE amenity_bookings ADD COLUMN balance_proof_of_payment TEXT").run(); } catch(e){}
try { db.prepare("ALTER TABLE amenity_bookings ADD COLUMN balance_transaction_reference TEXT").run(); } catch(e){}
try { db.prepare("ALTER TABLE amenity_bookings ADD COLUMN balance_amount_paid REAL DEFAULT 0").run(); } catch(e){}

try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN admin_notes TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE messages ADD COLUMN has_heart INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE messages ADD COLUMN reaction_unread INTEGER DEFAULT 0").run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    amount REAL,
    method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    is_read INTEGER DEFAULT 0,
    has_heart INTEGER DEFAULT 0,
    reaction_unread INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS automated_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    type TEXT, -- 'pre-arrival', 'post-checkout'
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS staff_dtr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'present',
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS housekeeping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    staff_id INTEGER,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    actor_name TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    entity_label TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(actor_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
`);

// Seed Rooms if empty
const roomCount = db.prepare("SELECT COUNT(*) as count FROM rooms").get() as { count: number };
if (roomCount.count === 0) {
  const insertRoom = db.prepare("INSERT INTO rooms (name, type, description, price, capacity, beds, image_url, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const salakotImages = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/640319608_1567528164475455_2709569030306835485_n.jpg",
    "/src/641145568_2018436052056912_4478781217590781643_n.jpg",
    "/src/640888235_1638505960929333_6337003060724219881_n.jpg",
    "/src/639584544_1606783847135354_491132229382811892_n.jpg"
  ]);
  const salakotRoom1Images = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/640319608_1567528164475455_2709569030306835485_n.jpg",
    "/src/641145568_2018436052056912_4478781217590781643_n.jpg",
    "/src/640888235_1638505960929333_6337003060724219881_n.jpg",
    "/src/639584544_1606783847135354_491132229382811892_n.jpg",
    "/src/640756123_4477221685882725_1405252564951383475_n.jpg"
  ]);
  const salakotRoom2Images = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/641727267_764936260014235_3873639624002707736_n.jpg",
    "/src/646282494_1242456171288115_6760961007953019625_n.jpg",
    "/src/640601675_25885362091113171_6569735119292729485_n.jpg",
    "/src/640945362_26072958002356332_6459435786840651517_n.jpg"
  ]);
  const bubuImages = JSON.stringify([
    "/src/bubu-cover.jpg",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
  ]);
  const bubuSuiteAImages = JSON.stringify([
    "/src/bubu-cover.jpg",
    "/src/664210733_1256366179987166_5527235306266192659_n.jpg",
    "/src/641328477_901982226057038_417138723781078497_n.jpg",
    "/src/640397043_1244756644465576_1212499529625400727_n.jpg",
    "/src/646142069_4456375354688371_854695215553117776_n.jpg"
  ]);
  insertRoom.run("Salakot - Room 1", "Standard", "A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).", 3000, 2, "1 Bed", "/src/salakot-cover.jpg", salakotRoom1Images);
  insertRoom.run("Salakot - Room 2", "Standard", "A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).", 2900, 2, "1 Bed", "/src/salakot-cover.jpg", salakotRoom2Images);
  insertRoom.run("Salakot - Room 3", "Standard", "A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).", 2900, 2, "1 Bed", "/src/salakot-cover.jpg", salakotImages);
  insertRoom.run("Salakot - Room 4", "Standard", "A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).", 2900, 2, "1 Bed", "/src/salakot-cover.jpg", salakotImages);
  insertRoom.run("Bubu Room Suite A", "Family Suite", "Spacious family room with breakfast included. Ideal for large groups.", 6950, 8, "Double Bed", "/src/bubu-cover.jpg", bubuSuiteAImages);
  insertRoom.run("Bubu Room Suite B", "Family Suite", "Spacious family room with breakfast included. Ideal for large groups.", 6950, 8, "Double Bed", "/src/bubu-cover.jpg", bubuImages);
} else {
  // Update existing rooms to match new specs
  const salakotImages = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/640319608_1567528164475455_2709569030306835485_n.jpg",
    "/src/641145568_2018436052056912_4478781217590781643_n.jpg",
    "/src/640888235_1638505960929333_6337003060724219881_n.jpg",
    "/src/639584544_1606783847135354_491132229382811892_n.jpg"
  ]);
  const salakotRoom1Images = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/640319608_1567528164475455_2709569030306835485_n.jpg",
    "/src/641145568_2018436052056912_4478781217590781643_n.jpg",
    "/src/640888235_1638505960929333_6337003060724219881_n.jpg",
    "/src/639584544_1606783847135354_491132229382811892_n.jpg",
    "/src/640756123_4477221685882725_1405252564951383475_n.jpg"
  ]);
  const salakotRoom2Images = JSON.stringify([
    "/src/salakot-cover.jpg",
    "/src/641727267_764936260014235_3873639624002707736_n.jpg",
    "/src/646282494_1242456171288115_6760961007953019625_n.jpg",
    "/src/640601675_25885362091113171_6569735119292729485_n.jpg",
    "/src/640945362_26072958002356332_6459435786840651517_n.jpg"
  ]);
  const bubuImages = JSON.stringify([
    "/src/bubu-cover.jpg",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
  ]);
  const bubuSuiteAImages = JSON.stringify([
    "/src/bubu-cover.jpg",
    "/src/664210733_1256366179987166_5527235306266192659_n.jpg",
    "/src/641328477_901982226057038_417138723781078497_n.jpg",
    "/src/640397043_1244756644465576_1212499529625400727_n.jpg",
    "/src/646142069_4456375354688371_854695215553117776_n.jpg"
  ]);
  db.prepare("UPDATE rooms SET images = ? WHERE name LIKE 'Salakot%'").run(salakotImages);
  db.prepare("UPDATE rooms SET images = ? WHERE name = 'Salakot - Room 1'").run(salakotRoom1Images);
  db.prepare("UPDATE rooms SET images = ? WHERE name = 'Salakot - Room 2'").run(salakotRoom2Images);
  db.prepare("UPDATE rooms SET images = ? WHERE name LIKE 'Bubu Room%'").run(bubuImages);
  db.prepare("UPDATE rooms SET images = ? WHERE name = 'Bubu Room Suite A'").run(bubuSuiteAImages);
  db.prepare("UPDATE rooms SET name = 'Salakot - Room 4', type = 'Standard', price = 2900, description = 'A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).' WHERE name = 'Executive Suite'").run();
  db.prepare("UPDATE rooms SET price = 3000, description = 'A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).' WHERE name = 'Salakot - Room 1'").run();
  db.prepare("UPDATE rooms SET description = 'A cozy room perfect for couples, featuring a comfortable bed and modern amenities. Standard occupancy is 2 guests, with 1 extra bed available upon request (max 3 guests total).' WHERE name LIKE 'Salakot%'").run();
  db.prepare("UPDATE rooms SET type = 'Family Suite' WHERE name LIKE 'Bubu Room%'").run();
  db.prepare("UPDATE rooms SET image_url = '/src/salakot-cover.jpg' WHERE name LIKE 'Salakot%'").run();
  db.prepare("UPDATE rooms SET image_url = '/src/bubu-cover.jpg' WHERE name LIKE 'Bubu Room%'").run();
  // Ensure names are consistent
  db.prepare("UPDATE rooms SET name = 'Bubu Room Suite A' WHERE name LIKE 'Bubu Room%Suite A%' OR name LIKE 'Bubu Room% (Suite A)%'").run();
  db.prepare("UPDATE rooms SET name = 'Bubu Room Suite B' WHERE name LIKE 'Bubu Room%Suite B%' OR name LIKE 'Bubu Room% (Suite B)%'").run();
}

// Seed Admin
const adminUser = db.prepare("SELECT * FROM users WHERE username = 'admin'").get() as any;
const hashedPassword = bcrypt.hashSync("admin123", 10);
if (!adminUser) {
  db.prepare("INSERT INTO users (username, password, first_name, last_name, email, role) VALUES (?, ?, ?, ?, ?, ?)").run("admin", hashedPassword, "System", "Admin", "admin@dabali.com", "admin");
}
// Removed the ELSE block that forces a password reset on every server restart.


// Migration: Ensure image_url exists in amenities
try {
  db.prepare("ALTER TABLE amenities ADD COLUMN image_url TEXT").run();
} catch (e) {}

// Migration: Ensure images exists in amenities
try {
  db.prepare("ALTER TABLE amenities ADD COLUMN images TEXT").run();
} catch (e) {}

// Migration: Ensure location exists in amenities
try {
  db.prepare("ALTER TABLE amenities ADD COLUMN location TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenities ADD COLUMN price REAL DEFAULT 0").run();
} catch (e) {}
// Migration: Ensure stock exists in amenities (NULL = unlimited stock)
try {
  db.prepare("ALTER TABLE amenities ADD COLUMN stock INTEGER").run();
} catch (e) {}
// Tracks whether a unit of stock has already been taken for this booking, so a booking
// that oscillates confirmed -> pending_verification (balance payment) -> confirmed again
// isn't double-decremented or falsely blocked as "out of stock" on its second confirmation.
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN stock_decremented INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE amenity_bookings ADD COLUMN total_price REAL DEFAULT 0").run();
} catch (e) {}

// Migration: Ensure images exists in rooms
try {
  db.prepare("ALTER TABLE rooms ADD COLUMN images TEXT").run();
} catch (e) {}

// Seed Amenities
const amenitiesToSeed = [
  { 
    name: "Infinity Pool", 
    description: "Experience pure relaxation in our crystal-clear infinity pool.\n\n**Entrance Fee:**\n- Adult: ₱90.00\n- Child: ₱60.00 (5yrs old & below)\n\n**Cottages:**\n- Large Tent: ₱2,500.00 (Max of 20 pax)\n- Gray Tent: ₱2,000.00 (Max of 15 pax)\n- Umbrella: ₱500.00 (Max of 8 pax)\n- Umbrella: ₱600.00 (Near the pool)", 
    icon: "Waves",
    location: "Main Resort Area",
    price: 90,
    image_url: "/src/Infinity Pool-1.jpg",
    images: JSON.stringify([
      "/src/Infinity Pool-1.jpg",
      "/src/480406880_644040298153654_2463853349071358905_n.jpg",
      "/src/Gemini_Generated_Image_kjvmjykjvmjykjvm-5e2ae1f2-825a-4783-8463-521651433e35.png",
      "/src/Gemini_Generated_Image_oe3usqoe3usqoe3u-2b1871a5-59ee-4f41-9b56-1cc75fc0b54f.png",
      "/src/480445259_644030531487964_9076444296381717985_n.jpg"
    ])
  },
  { 
    name: "Fine Dining", 
    description: "Exquisite culinary experiences featuring local and international flavors.\n\n**Corkages:**\n- Letchon: ₱400.00\n- Letchon Belly: ₱300.00\n\n**Kape Rosario:**\n- Espresso: ₱80.00\n- Americano: ₱95.00\n- Latte: ₱75.00\n- Vietnamese Coffee: ₱125.00\n- Spanish Latte: ₱135.00\n- Caramel: ₱140.00\n- Matcha: ₱140.00\n- Hazelnut Latte: ₱140.00\n- Vanilla: ₱140.00\n\n**Non-Coffee:**\n- Chocolate: ₱145.00\n- Matcha Latte: ₱150.00\n- Blueberry Fizz: ₱125.00\n- Strawberry Fizz: ₱125.00\n- Green Apple: ₱125.00\n\n**Pizza Menu:**\n- Hawaiian Pizza (₱599): Mushroom, Black Olives, White Onion, Bell pepper, Pineapple.\n- Veggie Pesto Pizza (₱599): Broccoli, Mushroom, Cauliflower, Black Olives, White Onion, Bell Pepper.\n- BBQ Chicken Pizza (₱599): Barbeque Chicken, Mushroom, Pesto, Black Olives, White Onion, Bell Pepper.\n- Cheese and Bacon Pizza (₱599): Cheese, Bacon, Mushroom, Black Olives, White Onion, Bell Pepper.\n- Garlic Shrimp Pizza (₱599): Shrimp, Pesto, Mushroom, Black Olives, White Onion, Bell Pepper.", 
    icon: "Coffee",
    location: "Main Resort Area",
    price: 0,
    image_url: "/src/Fine Dining.jpg",
    images: JSON.stringify([
      "/src/Fine Dining.jpg",
      "/src/481790925_653967750494242_6026827539068098534_n.jpg",
      "/src/Gemini_Generated_Image_iyqatyiyqatyiyqa-d19134c9-b152-46be-85ae-e74e55cfde87.png",
      "/src/Gemini_Generated_Image_n684p0n684p0n684-92668cd0-1ee0-4912-8a99-2f3286fdc34b.png"
    ])
  },
  { 
    name: "Pavilion", 
    description: "Our iconic function room with traditional architecture. Please note that there is only one Pavilion unit available for exclusive use.\n\n**Venue (₱11,000):**\n- ✓ Max 50 pax\n- ✓ Exclusive Use of Pavilion\n- ✓ Pool Access (Includes swimming entrance for 50 pax)\n- ✓ Sound System with microphones", 
    icon: "Hotel",
    location: "Located at the heart of the resort! You’ll find the Pavilion in the Main Resort Area, perfectly positioned right in front of the pool.",
    price: 11000,
    image_url: "/src/Pavilion.jpg",
    images: JSON.stringify([
      "/src/Pavilion.jpg",
      "/src/643787299_1216608037352086_6279788972109671811_n.jpg",
      "/src/646469465_1325380779615286_8192261069276533553_n.jpg",
      "/src/475775117_632931419264542_2841795206770194977_n.jpg",
      "/src/479978587_641307308426953_3407257930518345529_n.jpg"
    ])
  },
  { 
    name: "Colored Tent/Team Building", 
    description: "Venue (₱6,000):\n\n✓ Max 100 pax\n\n✓ Use of Pavilion\n\n✓ Tables and Chairs\n\n✗ Pool Access (Requires additional entrance fee)", 
    icon: "Calendar",
    location: "The Colored Tent is located in the rear section of the resort, offering a private and spacious area for group activities.",
    price: 6000,
    image_url: "/src/Colored Tent.jpg",
    images: JSON.stringify([
      "/src/Colored Tent.jpg",
      "/src/480084227_641106218447062_3256291434929677055_n.jpg",
      "/src/474584676_625466180011066_5754091576396187073_n.jpg",
      "/src/475317840_630208526203498_7342393900897973481_n.jpg"
    ])
  },
];

for (const a of amenitiesToSeed) {
  const existing = db.prepare("SELECT id FROM amenities WHERE name = ?").get(a.name) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE amenities SET description = ?, icon = ?, location = ?, image_url = ?, images = ?, price = ? WHERE id = ?").run(a.description, a.icon, a.location, a.image_url, a.images, a.price, existing.id);
  } else {
    db.prepare("INSERT INTO amenities (name, description, icon, location, image_url, images, price) VALUES (?, ?, ?, ?, ?, ?, ?)").run(a.name, a.description, a.icon, a.location, a.image_url, a.images, a.price);
  }
}

}

try {
  initializeDatabase();
} catch (err: any) {
  if (err.code === 'SQLITE_CORRUPT') {
    console.error("Database corruption detected during initialization. Recreating...");
    db.close();
    if (fs.existsSync("resort.db")) fs.unlinkSync("resort.db");
    if (fs.existsSync("resort.db-wal")) fs.unlinkSync("resort.db-wal");
    if (fs.existsSync("resort.db-shm")) fs.unlinkSync("resort.db-shm");
    db = connectDatabase();
    initializeDatabase();
  } else {
    throw err;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize WebSocket server
  wss = new WebSocketServer({ server });

  wss.on('error', (error) => {
    console.error('CRITICAL: WebSocket Server error:', error);
  });

  app.set('trust proxy', 1);

  app.use(session({
    secret: 'da-bali-resort-secret',
    resave: true,
    saveUninitialized: true,
    name: 'da-bali-session',
    proxy: true,
    rolling: true,
    cookie: { 
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 
    }
  }));

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      console.log(`[API Request] ${req.method} ${req.url} - Session: ${req.sessionID} - User: ${req.session?.userId || 'none'} (${req.session?.userRole || 'none'})`);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Health Check
  app.get("/api/health", (req, res) => {
    try {
      console.log("Health check request received");
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("Health check error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/debug/logs", (req, res) => {
    res.json({ logs: debugLogs });
  });

  // Middleware to check if user is admin
  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const isApiRequest = req.path.startsWith('/api/') || 
                           req.originalUrl.startsWith('/api/') || 
                           req.headers.accept?.includes('application/json') ||
                           req.headers['content-type']?.includes('application/json');
      
      // Check session first, then fallback to headers (for iframe preview environments)
      const sessionUserId = (req.session as any)?.userId;
      const sessionUserRole = (req.session as any)?.userRole;
      
      const headerUserId = req.headers['x-user-id'];
      const headerUserRole = req.headers['x-user-role'];
      
      const userId = sessionUserId || headerUserId;
      const userRole = sessionUserRole || headerUserRole;
      
      if (userId && userRole === 'admin') {
        (req as any).adminId = userId;
        next();
      } else {
        console.warn(`[isAdmin] Unauthorized access attempt to ${req.method} ${req.originalUrl} by user ${userId || 'anonymous'} (Role: ${userRole || 'none'})`);
        
        if (isApiRequest) {
          return res.status(403).json({ 
            error: "Unauthorized: Admin access required",
            details: "You do not have the necessary permissions to access this resource. Please ensure you are logged in as an admin.",
            debug: { userId, userRole }
          });
        }
        
        res.status(403).json({ error: "Unauthorized: Admin access required" });
      }
    } catch (e) {
      console.error("isAdmin middleware error:", e);
      res.status(500).json({ error: "Internal server error in authorization check" });
    }
  };

  // Middleware to check if user is staff or admin
  const isStaffOrAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const isApiRequest = req.path.startsWith('/api/') ||
                           req.originalUrl.startsWith('/api/') ||
                           req.headers.accept?.includes('application/json') ||
                           req.headers['content-type']?.includes('application/json');

      // Check session first, then fallback to headers (for iframe preview environments)
      const sessionUserId = (req.session as any)?.userId;
      const sessionUserRole = (req.session as any)?.userRole;

      const headerUserId = req.headers['x-user-id'];
      const headerUserRole = req.headers['x-user-role'];

      const userId = sessionUserId || headerUserId;
      const userRole = sessionUserRole || headerUserRole;

      if (userId && (userRole === 'admin' || userRole === 'staff')) {
        (req as any).adminId = userId;
        next();
      } else {
        console.warn(`[isStaffOrAdmin] Unauthorized access attempt to ${req.method} ${req.originalUrl} by user ${userId || 'anonymous'} (Role: ${userRole || 'none'})`);

        if (isApiRequest) {
          return res.status(403).json({
            error: "Unauthorized: Staff or admin access required",
            details: "You do not have the necessary permissions to access this resource. Please ensure you are logged in as staff or admin.",
            debug: { userId, userRole }
          });
        }

        res.status(403).json({ error: "Unauthorized: Staff or admin access required" });
      }
    } catch (e) {
      console.error("isStaffOrAdmin middleware error:", e);
      res.status(500).json({ error: "Internal server error in authorization check" });
    }
  };

  // Middleware to check if user is housekeeping, staff, or admin (used by the housekeeping module,
  // kept separate from isStaffOrAdmin so housekeeping accounts don't inherit access to
  // staff-only endpoints like payments/DTR/bookings).
  const isHousekeepingStaff = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const isApiRequest = req.path.startsWith('/api/') ||
                           req.originalUrl.startsWith('/api/') ||
                           req.headers.accept?.includes('application/json') ||
                           req.headers['content-type']?.includes('application/json');

      const sessionUserId = (req.session as any)?.userId;
      const sessionUserRole = (req.session as any)?.userRole;

      const headerUserId = req.headers['x-user-id'];
      const headerUserRole = req.headers['x-user-role'];

      const userId = sessionUserId || headerUserId;
      const userRole = sessionUserRole || headerUserRole;

      if (userId && (userRole === 'admin' || userRole === 'staff' || userRole === 'housekeeping')) {
        (req as any).adminId = userId;
        next();
      } else {
        console.warn(`[isHousekeepingStaff] Unauthorized access attempt to ${req.method} ${req.originalUrl} by user ${userId || 'anonymous'} (Role: ${userRole || 'none'})`);

        if (isApiRequest) {
          return res.status(403).json({
            error: "Unauthorized: Housekeeping, staff, or admin access required",
            debug: { userId, userRole }
          });
        }

        res.status(403).json({ error: "Unauthorized: Housekeeping, staff, or admin access required" });
      }
    } catch (e) {
      console.error("isHousekeepingStaff middleware error:", e);
      res.status(500).json({ error: "Internal server error in authorization check" });
    }
  };

  // Resolves the caller's identity from session (normal browser auth) or x-user-id/
  // x-user-role headers (fallback used elsewhere in this file for iframe preview
  // environments where the session cookie doesn't reliably reach the server).
  const getAuthContext = (req: express.Request) => {
    const sessionUserId = (req.session as any)?.userId;
    const sessionUserRole = (req.session as any)?.userRole;
    const headerUserId = req.headers['x-user-id'];
    const headerUserRole = req.headers['x-user-role'];
    const userId = sessionUserId || headerUserId;
    const userRole = sessionUserRole || headerUserRole;
    return { userId, userRole, isStaff: userRole === 'admin' || userRole === 'staff' };
  };

  // Records an Admin/Staff action for the Audit Logs viewer (booking status changes,
  // payment verification, staff/room/amenity edits, etc). The actor's display name is
  // resolved once at write time so the log stays readable even if that user account is
  // later deleted. Never throws - a logging failure must not break the action it's logging.
  const logAuditAction = (
    req: express.Request,
    action: string,
    entityType: string,
    entityId: number | string | null,
    entityLabel?: string | null,
    details?: Record<string, any>
  ) => {
    try {
      const { userId, userRole } = getAuthContext(req);
      let actorName = 'Unknown';
      if (userId) {
        const actor = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(userId) as any;
        if (actor) {
          actorName = `${actor.first_name || ''} ${actor.last_name || ''}`.trim() || 'Unknown';
        }
      }
      db.prepare(`
        INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId || null,
        actorName,
        userRole || null,
        action,
        entityType,
        entityId ?? null,
        entityLabel || null,
        details ? JSON.stringify(details) : null
      );
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }
  };

  // Auth Routes
  app.get("/api/auth/me", (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = db.prepare("SELECT id, username, first_name, last_name, email, role, contact_no, address, schedule FROM users WHERE id = ?").get(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (e) {
      console.error("Auth me error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password, firstName, lastName, contactNo, address, email } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const info = db.prepare("INSERT INTO users (username, password, first_name, last_name, contact_no, address, email) VALUES (?, ?, ?, ?, ?, ?, ?)").run(username, hashedPassword, firstName, lastName, contactNo, address, email);
      const user = db.prepare("SELECT id, username, first_name, last_name, email, role, contact_no, address FROM users WHERE id = ?").get(info.lastInsertRowid) as any;
      if (!user) {
        return res.status(500).json({ error: "Failed to retrieve user after registration" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Username or email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username) as any;
      if (user && bcrypt.compareSync(password, user.password)) {
        const { password: _, ...userWithoutPassword } = user;
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ error: "Failed to save session" });
          }
          res.json(userWithoutPassword);
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/debug/list-users", isAdmin, (req, res) => {
    const users = db.prepare("SELECT username, id FROM users").all();
    res.json(users);
  });
  
  app.post("/api/debug/reset-jils", isAdmin, (req, res) => {
    try {
      const user = db.prepare("SELECT id FROM users WHERE lower(username) LIKE ? OR lower(first_name) LIKE ?").get('%jils%', '%jils%') as any;
      if (!user) {
        return res.status(404).json({ error: "User 'Jils' not found" });
      }
      const userId = user.id;
      db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(userId, userId);
      res.json({ success: true, message: `History cleared for Jils (ID: ${userId})` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout session destroy error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (e) {
      console.error("Logout error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = Date.now() + 3600000; // 1 hour

        db.prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?")
          .run(token, expiry, user.id);

        const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        await sendEmail(
          email,
          "Password Reset Request",
          `You requested a password reset. Click here to reset: ${resetLink}`,
          `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 1 hour.</p>`
        );
      }

      // Always return success for security
      res.json({ message: "If this email is registered, you will receive a link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      // Still return success to avoid email enumeration, or return error if preferred
      res.json({ message: "If this email is registered, you will receive a link" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?")
        .get(token, Date.now()) as any;

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?")
        .run(hashedPassword, user.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { firstName, lastName, email, contactNo, address } = req.body;
    const paramId = req.params.id;
    const userIdToUpdate = paramId === 'me' ? req.session.userId : paramId;
    
    if (!userIdToUpdate) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Try to find user by ID first
      let user = db.prepare("SELECT * FROM users WHERE id = ?").get(userIdToUpdate) as any;
      
      // If not found by ID, try finding by email as a fallback
      if (!user && email) {
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      }

      if (!user) {
        console.error(`User update failed: User not found for ID ${userIdToUpdate} or email ${email}`);
        return res.status(404).json({ error: "User not found. Please try logging out and in again to refresh your session." });
      }

      const userId = user.id;

      const result = db.prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, contact_no = ?, address = ? WHERE id = ?")
        .run(firstName, lastName, email, contactNo, address, userId);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: "Failed to update user profile." });
      }

      const updatedUser = db.prepare("SELECT id, username, first_name, last_name, email, role, contact_no, address FROM users WHERE id = ?").get(userId);
      res.json(updatedUser);
    } catch (e) {
      console.error("Update profile error:", e);
      res.status(400).json({ error: "Failed to update profile. This email might already be associated with another account." });
    }
  });

  // Room Routes
  app.get("/api/staff", isStaffOrAdmin, (req, res) => {
    try {
      const staff = db.prepare("SELECT id, first_name, last_name, username, role, schedule, position FROM users WHERE role IN ('admin', 'staff', 'housekeeping')").all();
      res.json(staff);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/rooms/:id/next-booking", (req, res) => {
    const { id } = req.params;
    const { currentCheckOut } = req.query;
    try {
      // Find the next booking for this room that starts after the current check-out
      const nextBooking = db.prepare(`
        SELECT * FROM bookings 
        WHERE room_id = ? 
        AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
        AND is_archived = 0
        AND check_in >= ?
        ORDER BY check_in ASC
        LIMIT 1
      `).get(id, currentCheckOut);
      res.json(nextBooking || null);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch next booking" });
    }
  });

  app.get("/api/rooms", (req, res) => {
    console.log("GET /api/rooms requested");
    try {
      const rooms = db.prepare("SELECT * FROM rooms ORDER BY name ASC").all() as any[];
      res.json(rooms.map(r => ({
        ...r,
        images: r.images ? JSON.parse(r.images) : []
      })));
    } catch (e) {
      console.error("GET /api/rooms failed:", e);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", isAdmin, (req, res) => {
    const { name, type, description, price, capacity, beds, image_url, images } = req.body;
    try {
      const info = db.prepare("INSERT INTO rooms (name, type, description, price, capacity, beds, image_url, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(name, type, description, price, capacity, beds, image_url, images ? JSON.stringify(images) : "[]");
      const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(info.lastInsertRowid) as any;
      if (!room) {
        return res.status(500).json({ error: "Failed to retrieve room after creation" });
      }
      console.log(`Admin ${req.session.userId} created room: ${name}`);
      logAuditAction(req, 'room_created', 'room', info.lastInsertRowid as number, name);
      broadcast({ type: 'ROOMS_UPDATED' });
      res.json({
        ...room,
        images: room.images ? JSON.parse(room.images) : []
      });
    } catch (e) {
      console.error("Create room error:", e);
      res.status(400).json({ error: "Failed to create room. Please check your inputs." });
    }
  });

  app.put("/api/rooms/:id", isAdmin, (req, res) => {
    console.log('PUT /api/rooms/:id body:', req.body);
    const { name, type, description, price, capacity, beds, image_url, images, status } = req.body;
    const { id } = req.params;
    console.log('PUT /api/rooms/:id id:', id);
    try {
      const existing = db.prepare("SELECT status FROM rooms WHERE id = ?").get(id) as { status: string } | undefined;
      const result = db.prepare("UPDATE rooms SET name = ?, type = ?, description = ?, price = ?, capacity = ?, beds = ?, image_url = ?, images = ?, status = ? WHERE id = ?").run(name, type, description, price, capacity, beds, image_url, images ? JSON.stringify(images) : "[]", status, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Room not found." });
      }

      console.log(`Admin ${req.session.userId} updated room ID ${id}: ${name}`);
      logAuditAction(req, 'room_updated', 'room', id, name, { previous_status: existing?.status, new_status: status });
      broadcast({ type: 'ROOMS_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Update room error:", e);
      res.status(400).json({ error: "Failed to update room. Please check your inputs." });
    }
  });

  app.delete("/api/rooms/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      const existing = db.prepare("SELECT name FROM rooms WHERE id = ?").get(id) as { name: string } | undefined;
      const result = db.prepare("UPDATE rooms SET status = 'inactive' WHERE id = ?").run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Room not found." });
      }

      console.log(`Admin ${req.session.userId} deactivated room ID ${id}`);
      logAuditAction(req, 'room_deactivated', 'room', id, existing?.name || null);
      broadcast({ type: 'ROOMS_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Deactivate room error:", e);
      res.status(400).json({ error: "Failed to deactivate room." });
    }
  });

  // Housekeeping Routes
  // Daily Room Turnover List & Cleanup Schedule: every active room enriched with today's
  // checkout (if any) and the next upcoming check-in, so housekeeping can prioritize cleaning.
  app.get("/api/housekeeping/rooms", isHousekeepingStaff, (req, res) => {
    try {
      const rooms = db.prepare("SELECT * FROM rooms WHERE status != 'inactive' ORDER BY name ASC").all() as any[];
      const today = new Date().toISOString().split('T')[0];

      const activeBookings = db.prepare(`
        SELECT b.*, u.first_name as first_name, u.last_name as last_name, u.email as email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.is_archived = 0 AND b.status IN ('confirmed', 'checked-in')
        ORDER BY b.check_in ASC
      `).all() as any[];

      const result = rooms.map(r => {
        const roomBookings = activeBookings.filter(b => b.room_id === r.id);
        // The stay currently occupying the room right now (if any) — covers multi-night stays
        // whose checkout is later than today, not just same-day checkouts.
        const currentOccupancy = roomBookings.find(b => b.check_in <= today && b.check_out >= today) || null;
        const checkoutToday = (currentOccupancy && currentOccupancy.check_out === today) ? currentOccupancy : null;
        const nextBooking = roomBookings
          .filter(b => b !== currentOccupancy && b.check_in >= today)
          .sort((a, b) => a.check_in.localeCompare(b.check_in))[0] || null;

        return {
          ...r,
          images: r.images ? JSON.parse(r.images) : [],
          checkout_today: checkoutToday,
          current_occupancy: currentOccupancy,
          next_booking: nextBooking
        };
      });

      res.json(result);
    } catch (e) {
      console.error("GET /api/housekeeping/rooms failed:", e);
      res.status(500).json({ error: "Failed to fetch housekeeping room list" });
    }
  });

  app.get("/api/housekeeping/logs", isHousekeepingStaff, (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT hl.*, r.name as room_name, u.first_name as staff_first_name, u.last_name as staff_last_name
        FROM housekeeping_logs hl
        LEFT JOIN rooms r ON hl.room_id = r.id
        LEFT JOIN users u ON hl.staff_id = u.id
        ORDER BY hl.created_at DESC
        LIMIT 100
      `).all();
      res.json(logs);
    } catch (e) {
      console.error("GET /api/housekeeping/logs failed:", e);
      res.status(500).json({ error: "Failed to fetch housekeeping logs" });
    }
  });

  app.patch("/api/rooms/:id/housekeeping-status", isHousekeepingStaff, (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const allowedStatuses = ['available', 'dirty', 'in_progress', 'maintenance'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid housekeeping status. Must be one of: available, dirty, in_progress, maintenance." });
    }

    try {
      const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as any;
      if (!room) {
        return res.status(404).json({ error: "Room not found." });
      }

      // A guest is physically in the room: housekeeping can't clear it for the next guest,
      // and taking it out of service here would erase the fact that it's occupied.
      if (room.status === 'occupied' && (status === 'available' || status === 'maintenance')) {
        return res.status(400).json({ error: "This room is currently occupied. Wait for guest checkout before changing its housekeeping status." });
      }

      const { userId } = getAuthContext(req);
      const params: any[] = [status];
      let setClause = "status = ?";
      if (notes !== undefined) {
        setClause += ", housekeeping_notes = ?";
        params.push(notes || null);
      }
      if (status === 'available') {
        setClause += ", last_cleaned_at = ?";
        params.push(new Date().toISOString());
      }
      params.push(id);

      db.prepare(`UPDATE rooms SET ${setClause} WHERE id = ?`).run(...params);
      db.prepare(`
        INSERT INTO housekeeping_logs (room_id, staff_id, previous_status, new_status, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId || null, room.status, status, notes || null);
      logAuditAction(req, 'housekeeping_status_changed', 'room', id, room.name, { from: room.status, to: status });

      console.log(`User ${userId} updated housekeeping status for room ID ${id}: ${room.status} -> ${status}`);
      broadcast({ type: 'HOUSEKEEPING_UPDATED' });
      broadcast({ type: 'ROOMS_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Update housekeeping status error:", e);
      res.status(400).json({ error: "Failed to update housekeeping status." });
    }
  });

  // Amenity Routes
  app.get("/api/amenities", (req, res) => {
    console.log("GET /api/amenities requested");
    try {
      const amenities = db.prepare("SELECT * FROM amenities").all() as any[];
      res.json(amenities.map(a => ({
        ...a,
        images: a.images ? JSON.parse(a.images) : []
      })));
    } catch (e) {
      console.error("GET /api/amenities failed:", e);
      res.status(500).json({ error: "Failed to fetch amenities" });
    }
  });

  app.post("/api/amenities", isAdmin, (req, res) => {
    const { name, description, icon, image_url, images, stock, price } = req.body;
    try {
      const info = db.prepare("INSERT INTO amenities (name, description, icon, image_url, images, stock, price) VALUES (?, ?, ?, ?, ?, ?, ?)").run(name, description, icon, image_url, images ? JSON.stringify(images) : "[]", stock === '' || stock === undefined ? null : stock, price === '' || price === undefined ? 0 : price);
      const amenity = db.prepare("SELECT * FROM amenities WHERE id = ?").get(info.lastInsertRowid) as any;
      
      console.log(`Admin ${req.session.userId} created amenity: ${name}`);
      logAuditAction(req, 'amenity_created', 'amenity', info.lastInsertRowid as number, name, { stock });
      broadcast({ type: 'AMENITIES_UPDATED' });
      res.json({
        ...amenity,
        images: amenity.images ? JSON.parse(amenity.images) : []
      });
    } catch (e) {
      console.error("Create amenity error:", e);
      res.status(400).json({ error: "Failed to create amenity. Please check your inputs." });
    }
  });

  app.put("/api/amenities/:id", isAdmin, (req, res) => {
    const { name, description, icon, image_url, images, status, stock, price } = req.body;
    const { id } = req.params;
    try {
      const existing = db.prepare("SELECT stock FROM amenities WHERE id = ?").get(id) as { stock: number | null } | undefined;
      const result = db.prepare("UPDATE amenities SET name = ?, description = ?, icon = ?, image_url = ?, images = ?, status = ?, stock = ?, price = ? WHERE id = ?").run(name, description, icon, image_url, images ? JSON.stringify(images) : "[]", status, stock === '' || stock === undefined ? null : stock, price === '' || price === undefined ? 0 : price, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Amenity not found." });
      }

      console.log(`Admin ${req.session.userId} updated amenity ID ${id}: ${name}`);
      logAuditAction(req, 'amenity_updated', 'amenity', id, name, { previous_stock: existing?.stock, new_stock: stock });
      broadcast({ type: 'AMENITIES_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Update amenity error:", e);
      res.status(400).json({ error: "Failed to update amenity. Please check your inputs." });
    }
  });

  app.delete("/api/amenities/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      const existing = db.prepare("SELECT name FROM amenities WHERE id = ?").get(id) as { name: string } | undefined;
      const result = db.prepare("UPDATE amenities SET status = 'inactive' WHERE id = ?").run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Amenity not found." });
      }

      console.log(`Admin ${req.session.userId} deactivated amenity ID ${id}`);
      logAuditAction(req, 'amenity_deactivated', 'amenity', id, existing?.name || null);
      broadcast({ type: 'AMENITIES_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Deactivate amenity error:", e);
      res.status(400).json({ error: "Failed to deactivate amenity." });
    }
  });

  // Booking Routes
  app.get("/api/bookings/check-availability", (req, res) => {
    try {
      const { roomId, checkIn, checkOut } = req.query;

      const room = db.prepare("SELECT status FROM rooms WHERE id = ?").get(roomId) as { status: string } | undefined;
      if (room && room.status !== 'available') {
        return res.json({ available: false, reason: roomUnavailableMessage(room.status) });
      }

      const conflict = db.prepare(`
        SELECT * FROM bookings
        WHERE room_id = ?
        AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
        AND is_archived = 0
        AND check_in < ?
        AND check_out > ?
      `).get(roomId, checkOut, checkIn);

      res.json({ available: !conflict });
    } catch (e) {
      console.error("Check availability error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/bookings", (req, res) => {
    try {
      const { userId, roomId, checkIn, checkOut, totalPrice, paymentMethod, guestsCount, extraBed } = req.body;
      
      // Verify user exists if userId is provided
      if (userId) {
        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
        if (!user) {
          return res.status(401).json({ error: "Your session has expired or your account no longer exists. Please log in again." });
        }
      }

      // Verify room exists and is currently bookable
      if (roomId) {
        const room = db.prepare("SELECT id, status FROM rooms WHERE id = ?").get(roomId) as { id: number; status: string } | undefined;
        if (!room) {
          return res.status(404).json({ error: "The selected room no longer exists. Please refresh and try again." });
        }
        if (room.status !== 'available') {
          return res.status(400).json({ error: roomUnavailableMessage(room.status) });
        }
      }

      // Final check for availability
      const conflict = db.prepare(`
        SELECT * FROM bookings
        WHERE room_id = ?
        AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
        AND is_archived = 0
        AND check_in < ?
        AND check_out > ?
      `).get(roomId, checkOut, checkIn);

      if (conflict) {
        return res.status(400).json({ error: "This room is already occupied for the selected dates. Please choose another room or different dates." });
      }

      const qrCode = 'DBR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const { proofOfPayment, transactionReference, amountPaid } = req.body;
      const status = proofOfPayment ? 'pending_verification' : 'pending';

      const info = db.prepare("INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price, payment_method, qr_code, guests_count, extra_bed, proof_of_payment, transaction_reference, amount_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        userId || null, 
        roomId || null, 
        checkIn || null, 
        checkOut || null, 
        totalPrice || 0, 
        paymentMethod || 'GCash', 
        qrCode, 
        guestsCount || 1, 
        extraBed ? 1 : 0,
        proofOfPayment || null,
        transactionReference || null,
        amountPaid || 0,
        status
      );
      
      const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(info.lastInsertRowid);
      if (!booking) {
        return res.status(500).json({ error: "Failed to retrieve booking after creation" });
      }
      
      // Broadcast new booking event (privacy: don't send full object)
      broadcast({ type: 'BOOKING_CREATED' });
      
      res.json(booking);
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id/status", (req, res) => {
    const { status, admin_notes } = req.body;
    const { id } = req.params;
    try {
      const beforeBooking = db.prepare("SELECT status FROM bookings WHERE id = ?").get(id) as { status: string } | undefined;
      if (admin_notes !== undefined) {
        db.prepare("UPDATE bookings SET admin_notes = ? WHERE id = ?").run(admin_notes, id);
      }

      if (status) {
        if (status === 'checked-in') {
          const booking = db.prepare("SELECT payment_status FROM bookings WHERE id = ?").get(id) as { payment_status: string } | undefined;
          if (booking && booking.payment_status !== 'Fully Paid') {
            return res.status(400).json({ error: "Guest cannot check-in until the balance is fully paid." });
          }
        }

        let qrCode = null;
        if (status === 'confirmed') {
          // Generate a unique QR code key
          qrCode = 'DBR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
          
          const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
          if (booking) {
            const totalPaid = (booking.amount_paid || 0) + (booking.balance_amount_paid || 0);
            const totalToPay = booking.total_price || 0;
            const newPaymentStatus = totalPaid >= totalToPay ? 'Fully Paid' : booking.payment_status;
            
            db.prepare("UPDATE bookings SET status = ?, qr_code = ?, payment_status = ? WHERE id = ?").run(status, qrCode, newPaymentStatus, id);
            
            const existingPayment = db.prepare("SELECT * FROM payments WHERE booking_id = ?").get(id);
            if (!existingPayment) {
              db.prepare("INSERT INTO payments (booking_id, amount, method, transaction_id) VALUES (?, ?, ?, ?)").run(
                id, 
                booking.amount_paid || 0, 
                booking.payment_method || 'GCash/BPI', 
                booking.transaction_reference || 'N/A'
              );
            }
          } else {
            db.prepare("UPDATE bookings SET status = ?, qr_code = ? WHERE id = ?").run(status, qrCode, id);
          }
        } else {
          db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
          
          // Automatic Room Status Revert/Update
          const booking = db.prepare("SELECT room_id FROM bookings WHERE id = ?").get(id) as { room_id: number } | undefined;
          if (booking) {
            if (status === 'Completed') {
              // Guest checked out: the room needs cleaning before it can be booked again.
              db.prepare("UPDATE rooms SET status = 'dirty' WHERE id = ? AND status != 'maintenance'").run(booking.room_id);
              db.prepare(`
                INSERT INTO housekeeping_logs (room_id, staff_id, previous_status, new_status, notes)
                VALUES (?, NULL, 'occupied', 'dirty', 'Auto-flagged after guest checkout')
              `).run(booking.room_id);
              broadcast({ type: 'HOUSEKEEPING_UPDATED' });
            } else if (status === 'cancelled') {
              // Booking never occupied the room, so no cleaning is needed.
              db.prepare("UPDATE rooms SET status = 'available' WHERE id = ? AND status != 'maintenance'").run(booking.room_id);
            } else if (status === 'checked-in') {
              db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(booking.room_id);
            }
          }
        }
      }
      
      const booking = db.prepare(`
        SELECT b.*, 
               u.first_name as first_name, 
               u.last_name as last_name, 
               u.email as email 
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        WHERE b.id = ?
      `).get(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (status === 'rejected') {
        broadcast({
          type: 'PAYMENT_REJECTED',
          bookingType: 'room',
          bookingId: id,
          userId: (booking as any).user_id,
          notes: admin_notes,
          title: (booking as any).room_name || 'Room'
        });
      }

      const guestLabel = `${(booking as any).first_name || ''} ${(booking as any).last_name || ''}`.trim() || `Booking #${id}`;
      if (status) {
        const auditAction = (status === 'confirmed' && beforeBooking?.status === 'pending_verification') ? 'payment_verified' : 'booking_status_changed';
        logAuditAction(req, auditAction, 'booking', id, guestLabel, { from: beforeBooking?.status, to: status });
      }
      if (admin_notes !== undefined) {
        logAuditAction(req, 'booking_notes_updated', 'booking', id, guestLabel);
      }

      // Broadcast update
      broadcast({ type: 'BOOKING_UPDATED', booking });
      
      res.json(booking);
    } catch (e) {
      console.error("Error updating booking status:", e);
      res.status(400).json({ error: "Failed to update booking" });
    }
  });

  app.put("/api/bookings/:id/proof-of-payment", (req, res) => {
    const { proofOfPayment, transactionReference, amountPaid } = req.body;
    const { id } = req.params;
    try {
      const booking = db.prepare("SELECT total_price FROM bookings WHERE id = ?").get(id) as any;
      const paymentStatus = (booking && amountPaid >= booking.total_price) ? 'Fully Paid' : 'Partially Paid';
      
      db.prepare(`
        UPDATE bookings 
        SET proof_of_payment = ?, 
            transaction_reference = ?, 
            amount_paid = ?, 
            status = 'pending_verification',
            payment_status = ?,
            admin_notes = NULL
        WHERE id = ?
      `).run(proofOfPayment, transactionReference, amountPaid, paymentStatus, id);
      
      broadcast({ type: 'BOOKING_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to upload proof of payment" });
    }
  });

  app.put("/api/bookings/:id/balance-payment", (req, res) => {
    const { proofOfPayment, transactionReference, amountPaid } = req.body;
    const { id } = req.params;
    try {
      const existingBooking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
      if (!existingBooking) return res.status(404).json({ error: "Booking not found" });

      // Use existing payment status on guest report, admin will verify
      const currentPaymentStatus = existingBooking.payment_status || 'Pending';
      const newBalancePaid = (existingBooking.balance_amount_paid || 0) + (amountPaid || 0);
      const totalPaid = (existingBooking.amount_paid || 0) + newBalancePaid;
      const totalToPay = existingBooking.total_price || 0;

      let newStatus = 'pending_verification';
      let newPaymentStatus = currentPaymentStatus;

      if (transactionReference === 'MANUAL_SETTLEMENT') {
        newStatus = existingBooking.status; // remain unchanged
      }
      
      if (totalPaid >= totalToPay) {
        newPaymentStatus = 'Fully Paid';
      } else {
        newPaymentStatus = 'Partially Paid';
      }

      db.prepare(`
        UPDATE bookings 
        SET balance_proof_of_payment = ?, 
            balance_transaction_reference = ?, 
            balance_amount_paid = ?,
            status = ?,
            payment_status = ?,
            admin_notes = NULL
        WHERE id = ?
      `).run(
        proofOfPayment, 
        transactionReference, 
        newBalancePaid, 
        newStatus,
        newPaymentStatus,
        id
      );
      
      // Add record to payments table
      db.prepare("INSERT INTO payments (booking_id, amount, method, transaction_id) VALUES (?, ?, ?, ?)").run(
        id, 
        amountPaid || 0, 
        existingBooking.payment_method || 'Balance', 
        transactionReference || 'N/A'
      );

      broadcast({ type: 'BOOKING_UPDATED' });
      res.json({ success: true, remaining: Math.max(0, totalToPay - totalPaid), paymentStatus: currentPaymentStatus });
    } catch (e) {
      console.error("Balance payment error:", e);
      res.status(400).json({ error: "Failed to upload balance payment" });
    }
  });

  app.put("/api/amenity-bookings/:id/proof-of-payment", (req, res) => {
    const { proofOfPayment, transactionReference, amountPaid } = req.body;
    const { id } = req.params;
    try {
      const booking = db.prepare("SELECT total_price, deposit_amount, user_id FROM amenity_bookings WHERE id = ?").get(id) as any;
      if (!booking) return res.status(404).json({ error: "Amenity booking not found" });

      const { userId, isStaff } = getAuthContext(req);
      const isOwner = !!userId && String(userId) === String(booking.user_id);
      if (!isOwner && !isStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const amountPaidNum = Number(amountPaid) || 0;
      const requiredDeposit = booking.deposit_amount || 0;
      if ((booking.total_price || 0) > 0 && amountPaidNum < requiredDeposit - 0.1) {
        return res.status(400).json({ error: `The required deposit for this reservation is ₱${requiredDeposit.toLocaleString()}. Please pay at least this amount before submitting.` });
      }

      const paymentStatus = amountPaidNum >= booking.total_price ? 'Fully Paid' : 'Partially Paid';

      db.prepare(`
        UPDATE amenity_bookings 
        SET proof_of_payment = ?, 
            transaction_reference = ?, 
            amount_paid = ?, 
            status = 'pending_verification',
            payment_status = ?,
            admin_notes = NULL
        WHERE id = ?
      `).run(proofOfPayment, transactionReference, amountPaidNum, paymentStatus, id);

      broadcast({ type: 'AMENITY_BOOKING_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to upload proof of payment" });
    }
  });

  app.put("/api/amenity-bookings/:id/balance-payment", (req, res) => {
    const { proofOfPayment, transactionReference, amountPaid } = req.body;
    const { id } = req.params;
    try {
      const existingBooking = db.prepare("SELECT * FROM amenity_bookings WHERE id = ?").get(id) as any;
      if (!existingBooking) return res.status(404).json({ error: "Amenity booking not found" });

      const { userId, isStaff } = getAuthContext(req);
      const isOwner = !!userId && String(userId) === String(existingBooking.user_id);
      if (!isOwner && !isStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      // MANUAL_SETTLEMENT records an in-person cash payment on the guest's behalf —
      // staff-only, otherwise a guest could self-report a fake settlement (no proof
      // required for this path) and mark their own balance as paid.
      if (req.body.transactionReference === 'MANUAL_SETTLEMENT' && !isStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Use existing payment status on guest report, admin will verify
      const currentPaymentStatus = existingBooking.payment_status || 'Pending';
      const newBalancePaid = (existingBooking.balance_amount_paid || 0) + (amountPaid || 0);
      const totalPaid = (existingBooking.amount_paid || 0) + newBalancePaid;
      const totalToPay = existingBooking.total_price || 0;

      let newStatus = 'pending_verification';
      let newPaymentStatus = currentPaymentStatus;

      if (transactionReference === 'MANUAL_SETTLEMENT') {
        newStatus = existingBooking.status; // remain unchanged
      }

      if (totalPaid >= totalToPay) {
        newPaymentStatus = 'Fully Paid';
      } else {
        newPaymentStatus = 'Partially Paid';
      }

      db.prepare(`
        UPDATE amenity_bookings 
        SET balance_proof_of_payment = ?, 
            balance_transaction_reference = ?, 
            balance_amount_paid = ?,
            status = ?,
            payment_status = ?,
            admin_notes = NULL
        WHERE id = ?
      `).run(
        proofOfPayment, 
        transactionReference, 
        newBalancePaid, 
        newStatus,
        newPaymentStatus,
        id
      );
      
      broadcast({ type: 'AMENITY_BOOKING_UPDATED' });
      res.json({ success: true, remaining: Math.max(0, totalToPay - totalPaid), paymentStatus: currentPaymentStatus });
    } catch (e) {
      console.error("Amenity balance payment error:", e);
      res.status(400).json({ error: "Failed to upload balance payment" });
    }
  });

  app.put("/api/bookings/:id/confirm", isStaffOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
      const qrCode = 'DBR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
      if (booking) {
        const totalPaid = (booking.amount_paid || 0) + (booking.balance_amount_paid || 0);
        const totalPrice = booking.total_price || 0;
        const newPaymentStatus = totalPaid >= totalPrice ? 'Fully Paid' : 'Partially Paid';
        
        db.prepare("UPDATE bookings SET status = 'confirmed', qr_code = ?, payment_status = ? WHERE id = ?").run(qrCode, newPaymentStatus, id);
        
        // Also create a payment record
        db.prepare("INSERT INTO payments (booking_id, amount, method, transaction_id) VALUES (?, ?, ?, ?)").run(
          id,
          booking.amount_paid || 0,
          booking.payment_method || 'GCash/BPI',
          booking.transaction_reference || 'N/A'
        );
      }

      const guestLabel = booking ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || `Booking #${id}` : `Booking #${id}`;
      logAuditAction(req, 'payment_verified', 'booking', id, guestLabel, { to: 'confirmed' });
      broadcast({ type: 'BOOKING_UPDATED' });
      res.json({ success: true, qrCode });
    } catch (e) {
      res.status(400).json({ error: "Failed to confirm booking" });
    }
  });

  app.post("/api/bookings/:id/archive", isStaffOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE bookings SET is_archived = 1 WHERE id = ?").run(id);
      logAuditAction(req, 'booking_archived', 'booking', id, `Booking #${id}`);
      broadcast({ type: 'BOOKING_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to archive booking" });
    }
  });

  app.delete("/api/bookings/:id", isStaffOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
      logAuditAction(req, 'booking_cancelled', 'booking', id, `Booking #${id}`);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to delete booking" });
    }
  });

  app.get("/api/bookings/user/:userId", (req, res) => {
    try {
      const bookings = db.prepare(`
        SELECT b.*, r.name as room_name, r.image_url 
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `).all(req.params.userId);
      res.json(bookings);
    } catch (e) {
      console.error("Fetch user bookings error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/payments", isStaffOrAdmin, (req, res) => {
    try {
      const payments = db.prepare(`
        SELECT p.*, 
               u.first_name as first_name, 
               u.last_name as last_name, 
               u.email as email,
               r.name as room_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY p.created_at DESC
      `).all();
      res.json(payments);
    } catch (e) {
      console.error("Fetch payments error:", e);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/bookings/all", isStaffOrAdmin, (req, res) => {
    try {
      const bookings = db.prepare(`
        SELECT b.*, r.name as room_name, 
               u.first_name as first_name, 
               u.last_name as last_name, 
               u.email as email,
               u.contact_no as contact_no
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
      `).all();
      res.json(bookings);
    } catch (e) {
      console.error("Fetch all bookings error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/bookings/:id/invoice", async (req, res) => {
    try {
      const booking = db.prepare(`
        SELECT b.*, r.name as room_name,
               COALESCE(u.first_name, b.first_name) as first_name,
               COALESCE(u.last_name, b.last_name) as last_name,
               COALESCE(u.email, b.email) as email
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
      `).get(req.params.id) as any;

      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const sessionUserId = (req.session as any)?.userId;
      const sessionUserRole = (req.session as any)?.userRole;
      const headerUserId = req.headers['x-user-id'];
      const headerUserRole = req.headers['x-user-role'];
      const userId = sessionUserId || headerUserId;
      const userRole = sessionUserRole || headerUserRole;

      const isOwner = userId && String(userId) === String(booking.user_id);
      const isStaff = userRole === 'admin' || userRole === 'staff';
      if (!isOwner && !isStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const amountPaid = (booking.amount_paid || 0) + (booking.balance_amount_paid || 0);
      const amountDue = Math.max(0, (booking.total_price || 0) - amountPaid);
      const guestName = [booking.first_name, booking.last_name].filter(Boolean).join(" ") || "Guest";

      const pdfBuffer = await generateInvoicePdf({
        id: booking.id,
        createdAt: booking.created_at ? format(new Date(booking.created_at), 'MMM dd, yyyy') : 'N/A',
        status: (booking.status || '').toUpperCase().replace('_', ' '),
        paymentMethod: booking.payment_method || 'N/A',
        reservationCode: booking.qr_code || `DB-${booking.id}`,
        itemLabel: "Room",
        itemName: booking.room_name || 'N/A',
        guestName,
        guestEmail: booking.email,
        details: [
          { label: "Check-in", value: format(new Date(booking.check_in), 'MMM dd, yyyy') },
          { label: "Check-out", value: format(new Date(booking.check_out), 'MMM dd, yyyy') },
          { label: "Duration", value: `${differenceInDays(new Date(booking.check_out), new Date(booking.check_in))} Nights` },
          { label: "Guests", value: `${booking.guests_count || 1} Person(s)` },
        ],
        totalPrice: booking.total_price || 0,
        amountPaid,
        amountDue,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${booking.id}.pdf`);
      res.send(pdfBuffer);
    } catch (e) {
      console.error("Invoice generation error:", e);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  app.post("/api/bookings/walk-in", (req, res) => {
    try {
      const { roomId, checkIn, checkOut, totalPrice, guestsCount, extraBed, firstName, lastName, email, contactNo } = req.body;

      const room = db.prepare("SELECT id, status FROM rooms WHERE id = ?").get(roomId) as { id: number; status: string } | undefined;
      if (!room) {
        return res.status(404).json({ error: "The selected room no longer exists. Please refresh and try again." });
      }
      if (room.status !== 'available') {
        return res.status(400).json({ error: roomUnavailableMessage(room.status) });
      }

      // Final check for availability
      const conflict = db.prepare(`
        SELECT * FROM bookings 
        WHERE room_id = ? 
        AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
        AND is_archived = 0
        AND check_in < ? 
        AND check_out > ?
      `).get(roomId, checkOut, checkIn);

      if (conflict) {
        return res.status(400).json({ error: "This room is already occupied for the selected dates." });
      }

      const qrCode = 'DBR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const info = db.prepare(`
        INSERT INTO bookings (room_id, check_in, check_out, total_price, status, qr_code, guests_count, extra_bed, first_name, last_name, email, contact_no, payment_method, payment_status, amount_paid, proof_of_payment) 
        VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, 'Walk-in', 'Fully Paid', ?, ?)
      `).run(
        roomId || null, 
        checkIn || null, 
        checkOut || null, 
        totalPrice || 0, 
        qrCode, 
        guestsCount || 1, 
        extraBed ? 1 : 0, 
        firstName || null, 
        lastName || null, 
        email || null, 
        contactNo || null,
        totalPrice || 0,
        req.body.proofOfPayment || null
      );
      
      // Create payment record (Full payment for walk-in usually)
      db.prepare("INSERT INTO payments (booking_id, amount, method, transaction_id) VALUES (?, ?, ?, ?)").run(info.lastInsertRowid, totalPrice, 'Walk-in', "WALK-" + Date.now());

      broadcast({ type: 'BOOKING_CREATED' });
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      console.error("Walk-in booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Amenity Booking Routes
  app.get("/api/amenity-bookings", isStaffOrAdmin, (req, res) => {
    try {
      const bookings = db.prepare(`
        SELECT ab.*, a.name as amenity_name, u.first_name, u.last_name, u.email
        FROM amenity_bookings ab
        JOIN amenities a ON ab.amenity_id = a.id
        JOIN users u ON ab.user_id = u.id
        ORDER BY ab.created_at DESC
      `).all();
      res.json(bookings);
    } catch (e) {
      console.error("Error fetching amenity bookings:", e);
      res.status(500).json({ error: "Failed to fetch amenity bookings" });
    }
  });

  app.get("/api/amenity-bookings/:id/invoice", async (req, res) => {
    try {
      const booking = db.prepare(`
        SELECT ab.*, a.name as amenity_name,
               COALESCE(u.first_name, ab.first_name) as first_name,
               COALESCE(u.last_name, ab.last_name) as last_name,
               COALESCE(u.email, ab.email) as email
        FROM amenity_bookings ab
        JOIN amenities a ON ab.amenity_id = a.id
        LEFT JOIN users u ON ab.user_id = u.id
        WHERE ab.id = ?
      `).get(req.params.id) as any;

      if (!booking) return res.status(404).json({ error: "Amenity booking not found" });

      const { userId, isStaff } = getAuthContext(req);
      const isOwner = !!userId && String(userId) === String(booking.user_id);
      if (!isOwner && !isStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const amountPaid = (booking.amount_paid || 0) + (booking.balance_amount_paid || 0);
      const amountDue = Math.max(0, (booking.total_price || 0) - amountPaid);
      const guestName = [booking.first_name, booking.last_name].filter(Boolean).join(" ") || "Guest";

      const pdfBuffer = await generateInvoicePdf({
        id: booking.id,
        createdAt: booking.created_at ? format(new Date(booking.created_at), 'MMM dd, yyyy') : 'N/A',
        status: (booking.status || '').toUpperCase().replace('_', ' '),
        paymentMethod: booking.payment_method || 'N/A',
        reservationCode: booking.qr_code || `DB-${booking.id}`,
        itemLabel: "Amenity",
        itemName: booking.amenity_name || 'N/A',
        guestName,
        guestEmail: booking.email,
        details: [
          { label: "Reservation Date", value: format(new Date(booking.reservation_date), 'MMM dd, yyyy') },
          { label: "Reservation Time", value: booking.reservation_time || 'N/A' },
          { label: "Pax Count", value: `${booking.pax_count || 1} Person(s)` },
        ],
        totalPrice: booking.total_price || 0,
        amountPaid,
        amountDue,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${booking.id}.pdf`);
      res.send(pdfBuffer);
    } catch (e) {
      console.error("Amenity invoice generation error:", e);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  app.get("/api/amenity-bookings/check-availability", (req, res) => {
    try {
      const { amenityId, date, time } = req.query;
      const amenity = db.prepare("SELECT name FROM amenities WHERE id = ?").get(amenityId) as { name: string } | undefined;
      
      if (!amenity) return res.status(404).json({ error: "Amenity not found" });

      // Only Pavilion has strict 1-unit limit for now. 
      // Colored Tent is flexible as per user request.
      if (amenity.name === 'Pavilion') {
        const conflict = db.prepare(`
          SELECT * FROM amenity_bookings 
          WHERE amenity_id = ? 
          AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
          AND is_archived = 0
          AND reservation_date = ?
          AND reservation_time = ?
        `).get(amenityId, date, time);
        
        return res.json({ available: !conflict });
      }
      
      res.json({ available: true });
    } catch (e) {
      console.error("Amenity check availability error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/amenity-bookings", (req, res) => {
    try {
      const { user_id, amenity_id, reservation_date, reservation_time, pax_count, details, proofOfPayment, paymentMethod, transactionReference, amountPaid, selections } = req.body;
      
      // Verify user exists
      if (user_id) {
        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(user_id);
        if (!user) {
          return res.status(401).json({ error: "Your session has expired or your account no longer exists. Please log in again." });
        }
      }

      // Verify amenity exists
      const amenity = db.prepare("SELECT name, price, stock FROM amenities WHERE id = ?").get(amenity_id) as { name: string, price: number, stock: number | null } | undefined;
      if (!amenity) {
        return res.status(404).json({ error: "The selected amenity no longer exists. Please refresh and try again." });
      }

      // Block overbooking once available stock is exhausted (NULL stock = unlimited)
      if (amenity.stock !== null && amenity.stock !== undefined && amenity.stock <= 0) {
        return res.status(400).json({ error: "Sorry, this amenity is currently out of stock." });
      }

      // Availability check for Pavilion
      if (amenity.name === 'Pavilion') {
        const conflict = db.prepare(`
          SELECT * FROM amenity_bookings 
          WHERE amenity_id = ? 
          AND status NOT IN ('cancelled', 'completed', 'Completed', 'no-show')
          AND is_archived = 0
          AND reservation_date = ?
          AND reservation_time = ?
        `).get(amenity_id, reservation_date, reservation_time);
        
        if (conflict) {
          return res.status(400).json({ error: "Sorry, the Pavilion is already reserved for this date and time." });
        }
      }

      // Total price is always computed here from trusted server-side data (the amenity's
      // configured price, or its item menu) — the client's own total is never trusted,
      // so a tampered request can't change what the guest is actually charged.
      const itemsTotal = calculateAmenityItemsTotal(amenity.name, selections);
      const totalPrice = itemsTotal !== null ? itemsTotal : (amenity.price || 0);

      // Full payment for cottage reservations (Infinity Pool / Tent / Umbrella)
      const isCottage = isCottageSelection(amenity.name, selections);
      const depositAmount = isCottage ? totalPrice : totalPrice * 0.5;
      const balanceAmount = totalPrice - depositAmount;
      const status = proofOfPayment ? 'pending_verification' : 'pending';
      const amountPaidNum = Number(amountPaid) || 0;

      // A reservation can't even be created below the required deposit — this is
      // enforced server-side (not just hidden/blocked in the UI) so the booking table
      // never accumulates underpaid, ambiguous-status requests.
      if (totalPrice > 0 && amountPaidNum < depositAmount - 0.1) {
        return res.status(400).json({ error: `The required deposit for this reservation is ₱${depositAmount.toLocaleString()}. Please pay at least this amount before submitting.` });
      }

      const info = db.prepare("INSERT INTO amenity_bookings (user_id, amenity_id, reservation_date, reservation_time, pax_count, details, total_price, deposit_amount, balance_amount, proof_of_payment, payment_method, status, transaction_reference, amount_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(user_id, amenity_id, reservation_date, reservation_time, pax_count, details, totalPrice, depositAmount, balanceAmount, proofOfPayment, paymentMethod, status, transactionReference, amountPaidNum);
      const booking = db.prepare("SELECT * FROM amenity_bookings WHERE id = ?").get(info.lastInsertRowid);
      if (!booking) {
        return res.status(500).json({ error: "Failed to retrieve amenity booking after creation" });
      }
      broadcast({ type: 'AMENITY_BOOKING_CREATED', booking });
      res.json(booking);
    } catch (e) {
      console.error("Error creating amenity booking:", e);
      res.status(400).json({ error: "Failed to create amenity booking" });
    }
  });

  app.patch("/api/amenity-bookings/:id", (req, res) => {
    try {
      const { status, admin_notes } = req.body;
      const { id } = req.params;

      const existingBooking = db.prepare("SELECT * FROM amenity_bookings WHERE id = ?").get(id) as any;
      if (!existingBooking) {
        return res.status(404).json({ error: "Amenity booking not found" });
      }

      // This endpoint serves two very different callers: staff/admin verifying,
      // confirming, checking in/out, or annotating a booking; and a guest cancelling
      // their own still-pending (not yet paid/verified) reservation. Only those two
      // cases are allowed — anything else (e.g. a guest trying to confirm their own
      // booking, or cancel one that's already being processed) is rejected.
      const { userId, isStaff } = getAuthContext(req);
      const isOwner = !!userId && String(userId) === String(existingBooking.user_id);
      const isGuestSelfCancel = isOwner && status === 'cancelled' && existingBooking.status === 'pending' && admin_notes === undefined;

      if (!isStaff && !isGuestSelfCancel) {
        return res.status(403).json({ error: "Unauthorized: Staff or admin access required" });
      }

      if (status) {
        const isNowUnconfirmed = ['cancelled', 'rejected', 'no-show'].includes(status);

        // Require full payment before check-in — the "Pay Balance" flow lets the guest
        // settle the remaining amount beforehand; the admin cannot bypass this by
        // calling the API directly even though the UI already hides the button.
        if (status === 'checked-in') {
          const totalPaid = (existingBooking.amount_paid || 0) + (existingBooking.balance_amount_paid || 0);
          const totalPrice = existingBooking.total_price || 0;
          if (totalPaid < totalPrice - 0.1) {
            return res.status(400).json({ error: "Cannot check in: the guest still has an outstanding balance. Ask them to complete payment first." });
          }
        }

        if (status === 'confirmed') {
          // A booking is confirmed once for the deposit, then again after the guest
          // pays and re-verifies the balance (status cycles back to pending_verification
          // in between) — stock_decremented ensures the unit is only ever taken once
          // per booking, not once per verification pass.
          if (!existingBooking.stock_decremented) {
            const amenity = db.prepare("SELECT stock FROM amenities WHERE id = ?").get(existingBooking.amenity_id) as { stock: number | null } | undefined;
            if (amenity && amenity.stock !== null && amenity.stock !== undefined) {
              if (amenity.stock <= 0) {
                return res.status(400).json({ error: "Cannot confirm this booking: no stock available for this amenity." });
              }
              db.prepare("UPDATE amenities SET stock = stock - 1 WHERE id = ?").run(existingBooking.amenity_id);
            }
            db.prepare("UPDATE amenity_bookings SET stock_decremented = 1 WHERE id = ?").run(id);
          }
          const totalPaid = (existingBooking.amount_paid || 0) + (existingBooking.balance_amount_paid || 0);
          const totalPrice = existingBooking.total_price || 0;
          const newPaymentStatus = totalPaid >= totalPrice ? 'Fully Paid' : 'Partially Paid';
          db.prepare("UPDATE amenity_bookings SET status = ?, payment_status = ? WHERE id = ?").run(status, newPaymentStatus, id);
        } else {
          if (existingBooking.stock_decremented && isNowUnconfirmed) {
            db.prepare("UPDATE amenities SET stock = stock + 1 WHERE id = ? AND stock IS NOT NULL").run(existingBooking.amenity_id);
            db.prepare("UPDATE amenity_bookings SET stock_decremented = 0 WHERE id = ?").run(id);
          }
          db.prepare("UPDATE amenity_bookings SET status = ? WHERE id = ?").run(status, id);
        }
      }

      if (admin_notes !== undefined) {
        db.prepare("UPDATE amenity_bookings SET admin_notes = ? WHERE id = ?").run(admin_notes, id);
      }

      const booking = db.prepare(`
        SELECT ab.*, 
               u.first_name as first_name, 
               u.last_name as last_name, 
               u.email as email, 
               a.name as amenity_name 
        FROM amenity_bookings ab 
        LEFT JOIN users u ON ab.user_id = u.id 
        JOIN amenities a ON ab.amenity_id = a.id
        WHERE ab.id = ?
      `).get(id);

      if (!booking) {
        return res.status(404).json({ error: "Amenity booking not found" });
      }

      if (status === 'rejected') {
        broadcast({
          type: 'PAYMENT_REJECTED',
          bookingType: 'amenity',
          bookingId: id,
          userId: (booking as any).user_id,
          notes: admin_notes,
          title: (booking as any).amenity_name || 'Amenity'
        });
      }

      // Only record staff/admin actions here - a guest cancelling their own pending
      // booking (isGuestSelfCancel) is routine self-service, not an admin/staff action.
      if (isStaff) {
        const amenityLabel = (booking as any)?.amenity_name || `Amenity Booking #${id}`;
        if (status) {
          const auditAction = status === 'confirmed' ? 'payment_verified' : 'amenity_booking_status_changed';
          logAuditAction(req, auditAction, 'amenity_booking', id, amenityLabel, { from: existingBooking.status, to: status });
        }
        if (admin_notes !== undefined) {
          logAuditAction(req, 'amenity_booking_notes_updated', 'amenity_booking', id, amenityLabel);
        }
      }

      broadcast({ type: 'AMENITY_BOOKING_UPDATED', booking });
      res.json(booking);
    } catch (e) {
      console.error("Error updating amenity booking:", e);
      res.status(400).json({ error: "Failed to update amenity booking" });
    }
  });

  app.post("/api/amenity-bookings/:id/archive", isStaffOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE amenity_bookings SET is_archived = 1 WHERE id = ?").run(id);
      logAuditAction(req, 'amenity_booking_archived', 'amenity_booking', id, `Amenity Booking #${id}`);
      broadcast({ type: 'AMENITY_BOOKING_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to archive amenity booking" });
    }
  });

  app.delete("/api/amenity-bookings/:id", isStaffOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
      const existingBooking = db.prepare("SELECT status, amenity_id, stock_decremented FROM amenity_bookings WHERE id = ?").get(id) as any;
      if (existingBooking && existingBooking.stock_decremented) {
        db.prepare("UPDATE amenities SET stock = stock + 1 WHERE id = ? AND stock IS NOT NULL").run(existingBooking.amenity_id);
      }
      db.prepare("UPDATE amenity_bookings SET status = 'cancelled', stock_decremented = 0 WHERE id = ?").run(id);
      logAuditAction(req, 'amenity_booking_cancelled', 'amenity_booking', id, `Amenity Booking #${id}`);
      broadcast({ type: 'AMENITY_BOOKING_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to delete amenity booking" });
    }
  });

  app.get("/api/my-amenity-bookings/:userId", (req, res) => {
    try {
      const bookings = db.prepare(`
        SELECT ab.*, a.name as amenity_name, a.image_url
        FROM amenity_bookings ab
        JOIN amenities a ON ab.amenity_id = a.id
        WHERE ab.user_id = ?
        ORDER BY ab.created_at DESC
      `).all(req.params.userId);
      res.json(bookings);
    } catch (e) {
      console.error("Error fetching my amenity bookings:", e);
      res.status(500).json({ error: "Failed to fetch your amenity bookings" });
    }
  });

  // Feedback Routes
  app.get("/api/feedbacks", (req, res) => {
    try {
      const feedbacks = db.prepare(`
        SELECT f.*, u.first_name, u.last_name
        FROM feedbacks f
        JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
      `).all();
      res.json(feedbacks);
    } catch (e) {
      console.error("Fetch feedbacks error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/feedbacks", (req, res) => {
    const { user_id, rating, comment } = req.body;
    try {
      db.prepare("INSERT INTO feedbacks (user_id, rating, comment) VALUES (?, ?, ?)").run(user_id, rating, comment);
      broadcast({ type: 'FEEDBACK_ADDED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to submit feedback" });
    }
  });

  // Hero Banners Routes
  // CRITICAL: These settings must remain persistent and only modified by Admin.
  app.get("/api/slideshow-items", (req, res) => {
    try {
      const banners = db.prepare("SELECT * FROM hero_banners ORDER BY order_index ASC, created_at DESC").all();
      res.json(banners);
    } catch (e) {
      console.error("Fetch hero banners error:", e);
      res.status(500).json({ error: "Failed to fetch hero banners. Please try again later." });
    }
  });

  app.post("/api/slideshow-items", isAdmin, (req, res) => {
    let data = req.body;
    if (data.payload) {
      try {
        data = JSON.parse(Buffer.from(data.payload, 'base64').toString('utf-8'));
      } catch (e) {
        console.error("Failed to decode payload:", e);
      }
    }
    const { title, description, image_url, link_url, type, is_active, order_index } = data;
    try {
      console.log(`[DEBUG] POST /api/slideshow-items - Body:`, JSON.stringify(data));
      console.log('Creating new banner:', { title, type, is_active });
      const info = db.prepare(`
        INSERT INTO hero_banners (title, description, image_url, link_url, type, is_active, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(title, description, image_url, link_url, type, is_active ?? 1, order_index ?? 0);
      
      console.log(`Admin ${req.session.userId} added a new hero banner: ${title}`);
      broadcast({ type: 'HERO_BANNERS_UPDATED' });
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Add hero banner error:", e);
      res.status(400).json({ error: "Failed to add hero banner", details: e.message });
    }
  });

  app.post("/api/slideshow-items/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    let data = req.body;
    if (data.payload) {
      try {
        data = JSON.parse(Buffer.from(data.payload, 'base64').toString('utf-8'));
      } catch (e) {
        console.error("Failed to decode payload:", e);
      }
    }
    const { title, description, image_url, link_url, type, is_active, order_index } = data;
    try {
      console.log(`[DEBUG] POST /api/slideshow-items/${id} - Body:`, JSON.stringify(data));
      console.log(`Updating banner ${id} with:`, { title, is_active, order_index });
      const result = db.prepare(`
        UPDATE hero_banners 
        SET title = ?, description = ?, image_url = ?, link_url = ?, type = ?, is_active = ?, order_index = ?
        WHERE id = ?
      `).run(
        title || null, 
        description || null, 
        image_url || null, 
        link_url || null, 
        type || null, 
        is_active !== undefined ? (is_active ? 1 : 0) : 1, 
        order_index !== undefined ? order_index : 0, 
        id
      );
      
      if (result.changes === 0) {
        console.warn(`Banner ${id} not found for update`);
        return res.status(404).json({ error: "Hero banner not found." });
      }

      console.log(`Admin ${req.session.userId} updated hero banner ID ${id}: ${title}`);
      broadcast({ type: 'HERO_BANNERS_UPDATED' });
      res.json({ success: true });
    } catch (e: any) {
      console.error("Update hero banner error:", e);
      res.status(400).json({ 
        error: "Failed to update hero banner", 
        details: e.message || "Unknown error occurred" 
      });
    }
  });

  app.delete("/api/slideshow-items/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare("DELETE FROM hero_banners WHERE id = ?").run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: "Hero banner not found." });
      }

      console.log(`Admin ${req.session.userId} deleted hero banner ID ${id}`);
      broadcast({ type: 'HERO_BANNERS_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      console.error("Delete hero banner error:", e);
      res.status(400).json({ error: "Failed to delete hero banner." });
    }
  });

  // Staff DTR Routes
  app.get("/api/staff-dtr", isStaffOrAdmin, (req, res) => {
    try {
      const { page = 1, limit = 10, month, year, search, userId, date, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = `
        SELECT d.*, u.first_name, u.last_name, u.schedule
        FROM staff_dtr d
        JOIN users u ON d.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (userId) {
        query += ` AND d.user_id = ?`;
        params.push(userId);
      }
      if (date) {
        query += ` AND d.date = ?`;
        params.push(date);
      } else {
        if (month) {
          query += ` AND strftime('%m', d.date) = ?`;
          params.push(month.toString().padStart(2, '0'));
        }
        if (year) {
          query += ` AND strftime('%Y', d.date) = ?`;
          params.push(year.toString());
        }
      }
      if (status && status !== 'all') {
        query += ` AND d.status = ?`;
        params.push(status);
      }
      if (search) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      const countQuery = query.replace("SELECT d.*, u.first_name, u.last_name, u.schedule", "SELECT COUNT(*) as total");
      const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

      query += ` ORDER BY d.id DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), offset);

      const dtr = db.prepare(query).all(...params);
      res.json({
        data: dtr,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (e) {
      console.error("Fetch staff DTR error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/history/:userId", (req, res) => {
    try {
      const history = db.prepare("SELECT * FROM staff_dtr WHERE user_id = ? ORDER BY id DESC").all(req.params.userId);
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch attendance history" });
    }
  });

  app.get("/api/staff/all", isStaffOrAdmin, (req, res) => {
    try {
      const staff = db.prepare("SELECT id, first_name, last_name, email, role FROM users WHERE role IN ('admin', 'staff')").all();
      res.json(staff);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff-dtr/export", isStaffOrAdmin, (req, res) => {
    const { year_start, year_end, start_date, end_date } = req.query;
    try {
      let query = `
        SELECT d.date, u.first_name, u.last_name, u.schedule, d.check_in, d.check_out, d.status
        FROM staff_dtr d
        JOIN users u ON d.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (year_start && year_end) {
        query += ` AND strftime('%Y', d.date) BETWEEN ? AND ?`;
        params.push(year_start.toString(), year_end.toString());
      } else if (start_date && end_date) {
        query += ` AND d.date BETWEEN ? AND ?`;
        params.push(start_date.toString(), end_date.toString());
      }
      query += ` ORDER BY d.date DESC`;

      const data = db.prepare(query).all(...params) as any[];

      const headers = ["Date", "First Name", "Last Name", "Schedule", "Check In", "Check Out", "Status"];
      const rows = data.map(r => [r.date, r.first_name, r.last_name, r.schedule, r.check_in, r.check_out, r.status]);
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv');
      const filename = start_date && end_date ? `staff_attendance_${start_date}_${end_date}.csv` : `staff_attendance_${year_start}_${year_end}.csv`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (e) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.get("/api/bookings/export", isStaffOrAdmin, (req, res) => {
    const { start_date, end_date } = req.query;
    try {
      let query = `
        SELECT b.id, b.check_in, b.check_out, b.status, b.payment_method, b.total_price,
               b.amount_paid, b.guests_count, b.created_at, r.name as room_name,
               COALESCE(u.first_name, b.first_name) as first_name,
               COALESCE(u.last_name, b.last_name) as last_name,
               COALESCE(u.email, b.email) as email
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.is_archived = 0
      `;
      const params: any[] = [];
      if (start_date && end_date) {
        query += ` AND b.check_in BETWEEN ? AND ?`;
        params.push(start_date.toString(), end_date.toString());
      }
      query += ` ORDER BY b.created_at DESC`;

      const data = db.prepare(query).all(...params) as any[];

      const headers = ["Booking ID", "Guest First Name", "Guest Last Name", "Email", "Room", "Check In", "Check Out", "Guests", "Status", "Payment Method", "Total Price", "Amount Paid", "Created At"];
      const rows = data.map(r => [r.id, r.first_name, r.last_name, r.email, r.room_name, r.check_in, r.check_out, r.guests_count, r.status, r.payment_method, r.total_price, r.amount_paid, r.created_at]);
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv');
      const filename = start_date && end_date ? `bookings_${start_date}_${end_date}.csv` : `bookings_all.csv`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (e) {
      console.error("Export bookings error:", e);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.get("/api/payments/export", isStaffOrAdmin, (req, res) => {
    const { start_date, end_date } = req.query;
    try {
      let query = `
        SELECT p.id, p.booking_id, p.amount, p.method, p.transaction_id, p.status, p.created_at,
               r.name as room_name,
               COALESCE(u.first_name, b.first_name) as first_name,
               COALESCE(u.last_name, b.last_name) as last_name,
               COALESCE(u.email, b.email) as email
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (start_date && end_date) {
        query += ` AND date(p.created_at) BETWEEN ? AND ?`;
        params.push(start_date.toString(), end_date.toString());
      }
      query += ` ORDER BY p.created_at DESC`;

      const data = db.prepare(query).all(...params) as any[];

      const headers = ["Payment ID", "Booking ID", "Guest First Name", "Guest Last Name", "Email", "Room", "Amount", "Method", "Transaction ID", "Status", "Date"];
      const rows = data.map(r => [r.id, r.booking_id, r.first_name, r.last_name, r.email, r.room_name, r.amount, r.method, r.transaction_id, r.status, r.created_at]);
      const csv = toCsv(headers, rows);

      res.setHeader('Content-Type', 'text/csv');
      const filename = start_date && end_date ? `payments_${start_date}_${end_date}.csv` : `payments_all.csv`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (e) {
      console.error("Export payments error:", e);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.delete("/api/staff-dtr/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE staff_dtr SET status = 'inactive' WHERE id = ?").run(id);
      broadcast({ type: 'DTR_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to delete DTR record" });
    }
  });

  app.post("/api/staff-dtr/check-in", (req, res) => {
    const { user_id, date, check_in } = req.body;
    try {
      const existing = db.prepare("SELECT id FROM staff_dtr WHERE user_id = ? AND date = ?").get(user_id, date);
      if (existing) {
        return res.status(400).json({ error: "Already checked in today." });
      }

      const user = db.prepare("SELECT schedule FROM users WHERE id = ?").get(user_id) as { schedule: string } | undefined;
      let status = 'present';
      
      if (user?.schedule) {
        // Simple late detection logic: if check-in is after schedule start time
        // Schedule format expected: "8:00 AM - 5:00 PM"
        const startTimeStr = user.schedule.split('-')[0].trim();
        const [time, period] = startTimeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const scheduleStart = new Date();
        scheduleStart.setHours(hours, minutes, 0, 0);
        
        const checkInTime = new Date();
        const [ciTime, ciPeriod] = check_in.split(' ');
        let [ciHours, ciMinutes] = ciTime.split(':').map(Number);
        if (ciPeriod === 'PM' && ciHours < 12) ciHours += 12;
        if (ciPeriod === 'AM' && ciHours === 12) ciHours = 0;
        checkInTime.setHours(ciHours, ciMinutes, 0, 0);
        
        // If check-in is more than 15 minutes after schedule start, mark as late
        if (checkInTime.getTime() > scheduleStart.getTime() + (15 * 60 * 1000)) {
          status = 'late';
        }
      }

      db.prepare("INSERT INTO staff_dtr (user_id, date, check_in, status) VALUES (?, ?, ?, ?)").run(user_id, date, check_in, status);
      broadcast({ type: 'DTR_UPDATED' });
      res.json({ success: true, status });
    } catch (e) {
      res.status(400).json({ error: "Failed to check in" });
    }
  });

  app.post("/api/staff-dtr/check-out", (req, res) => {
    const { user_id, date, check_out } = req.body;
    try {
      const record = db.prepare("SELECT id, check_out FROM staff_dtr WHERE user_id = ? AND date = ? ORDER BY id DESC").get(user_id, date) as { id: number, check_out: string | null } | undefined;
      if (!record) {
        return res.status(400).json({ error: "Must check in first." });
      }
      if (record.check_out) {
        return res.status(400).json({ error: "Already checked out today." });
      }

      db.prepare("UPDATE staff_dtr SET check_out = ? WHERE id = ?").run(check_out, record.id);
      broadcast({ type: 'DTR_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to check out" });
    }
  });

  app.patch("/api/users/:id/schedule", (req, res) => {
    const { schedule } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE users SET schedule = ? WHERE id = ?").run(schedule, id);
      broadcast({ type: 'DTR_UPDATED' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to update schedule" });
    }
  });
  app.get("/api/users", isAdmin, (req, res) => {
    const { role } = req.query;
    try {
      let query = "SELECT id, username, first_name, last_name, email, role, contact_no, address, schedule, created_at FROM users";
      const params: any[] = [];
      if (role) {
        query += " WHERE role = ?";
        params.push(role);
      }
      const users = db.prepare(query).all(...params);
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", (req, res) => {
    const { firstName, lastName, schedule } = req.body;
    try {
      db.prepare("UPDATE users SET first_name = ?, last_name = ?, schedule = ? WHERE id = ?").run(firstName, lastName, schedule, req.params.id);
      const user = db.prepare("SELECT id, username, first_name, last_name, email, role, contact_no, address, schedule, created_at FROM users WHERE id = ?").get(req.params.id);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAdmin, (req, res) => {
    try {
      const existing = db.prepare("SELECT first_name, last_name, role FROM users WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM staff_dtr WHERE user_id = ?").run(req.params.id);
      db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(req.params.id, req.params.id);
      // Optional: don't delete bookings if it's a real user, but mostly for staff.
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      const label = existing ? `${existing.first_name || ''} ${existing.last_name || ''}`.trim() : `User #${req.params.id}`;
      logAuditAction(req, 'user_deleted', 'user', req.params.id, label || `User #${req.params.id}`, { role: existing?.role });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Failed to delete user" });
    }
  });

  // --- Messages Endpoints ---
  app.get("/api/messages/:userId", (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const adminId = admin ? admin.id : 1;
      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
      `).all(userId, adminId, adminId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", (req, res) => {
    try {
      let { sender_id, receiver_id, content } = req.body;
      
      const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const adminId = admin ? admin.id : 1;

      // If receiver_id is the default '1', try to map to the actual admin
      if (receiver_id === 1) {
        receiver_id = adminId;
      }
      
      // If sender_id is the default '1' from auto-reply, map to actual admin
      if (sender_id === 1) {
        sender_id = adminId;
      }

      // Verify users exist
      const sender = db.prepare("SELECT id FROM users WHERE id = ?").get(sender_id);
      const receiver = db.prepare("SELECT id FROM users WHERE id = ?").get(receiver_id);
      
      if (!sender || !receiver) {
        return res.status(400).json({ error: "Invalid sender_id or receiver_id" });
      }

      const stmt = db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, content, is_read)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(sender_id, receiver_id, content, 0);
      
      const newMessage = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.delete("/api/messages/:id", (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const sessionUserId = req.session.userId;
      const headerUserId = req.headers['x-user-id'];
      const userIdStr = sessionUserId || headerUserId;
      const userId = userIdStr ? parseInt(userIdStr as string, 10) : null;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId) as any;
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({ error: "Forbidden: You can only delete your own messages" });
      }

      db.prepare("DELETE FROM messages WHERE id = ?").run(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/admin/messages/inbox", isAdmin, (req, res) => {
    try {
      const adminId = (req as any).adminId;
      const conversations = db.prepare(`
        SELECT 
          u.id as user_id, 
          u.first_name, 
          u.last_name, 
          u.email,
          m.content as last_message, 
          m.created_at as last_message_time,
          m.sender_id
        FROM users u
        JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
        WHERE u.id != ? AND m.id IN (
          SELECT MAX(id) 
          FROM messages 
          WHERE sender_id = u.id OR receiver_id = u.id
          GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        )
        ORDER BY m.created_at DESC
      `).all(adminId, adminId);

      
      const unreadCountsData = db.prepare(`
        SELECT CASE WHEN receiver_id = ? THEN sender_id ELSE receiver_id END as user_id, COUNT(*) as unread_count 
        FROM messages 
        WHERE (receiver_id = ? AND is_read = 0) OR (sender_id = ? AND reaction_unread = 1)
        GROUP BY 1
      `).all(adminId, adminId, adminId);
      
      const unreadMap: Record<number, number> = {};
      unreadCountsData.forEach((row: any) => {
        unreadMap[row.user_id] = row.unread_count;
      });

      const result = conversations.map((conv: any) => ({
        ...conv,
        unread_count: unreadMap[conv.user_id] || 0
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  app.patch("/api/admin/messages/:userId/read", isAdmin, (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const adminId = (req as any).adminId;
      db.prepare(`
        UPDATE messages SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).run(userId, adminId);
      db.prepare(`
        UPDATE messages SET reaction_unread = 0 
        WHERE sender_id = ? AND receiver_id = ? AND reaction_unread = 1
      `).run(adminId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  app.patch("/api/messages/:id/heart", (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const sessionUserId = req.session.userId;
      const headerUserId = req.headers['x-user-id'];
      const userIdStr = sessionUserId || headerUserId;
      const userId = userIdStr ? parseInt(userIdStr as string, 10) : null;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const msg = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId) as any;
      if (!msg) return res.status(404).json({ error: "Message not found" });

      const newHeartVal = msg.has_heart ? 0 : 1;
      db.prepare("UPDATE messages SET has_heart = ?, reaction_unread = ? WHERE id = ?").run(newHeartVal, newHeartVal, messageId);
      res.json({ success: true, has_heart: newHeartVal });
    } catch (error) {
      res.status(500).json({ error: "Failed to update reaction" });
    }
  });

  app.get("/api/messages/guest/unread", (req, res) => {
    try {
      const sessionUserId = req.session.userId;
      const headerUserId = req.headers['x-user-id'];
      const userIdStr = sessionUserId || headerUserId;
      const userId = userIdStr ? parseInt(userIdStr as string, 10) : null;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const adminId = admin ? admin.id : 1;

      const unread = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE (sender_id = ? AND receiver_id = ? AND is_read = 0) OR (sender_id = ? AND receiver_id = ? AND reaction_unread = 1)
      `).get(adminId, userId, userId, adminId) as any;
      
      res.json({ count: unread ? unread.count : 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread" });
    }
  });

  app.patch("/api/messages/guest/read", (req, res) => {
    try {
      const sessionUserId = req.session.userId;
      const headerUserId = req.headers['x-user-id'];
      const userIdStr = sessionUserId || headerUserId;
      const userId = userIdStr ? parseInt(userIdStr as string, 10) : null;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const adminId = admin ? admin.id : 1;

      db.prepare(`
        UPDATE messages SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).run(adminId, userId);
      db.prepare(`
        UPDATE messages SET reaction_unread = 0 
        WHERE sender_id = ? AND receiver_id = ? AND reaction_unread = 1
      `).run(userId, adminId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Booked room-nights count any booking that actually held/occupied the room - including
  // ones already finished ('completed'/'Completed') - and only exclude bookings that never
  // resulted in occupancy ('cancelled', 'rejected', 'no-show'). This is deliberately not the
  // same exclusion list used by the "next booking"/availability-check queries elsewhere in
  // this file, which drop 'completed' too - those are asking "is this room free for a NEW
  // booking", not "did this room-night get used". Nights are clipped to the
  // [startDate, endDateExclusive) window so a booking spanning the boundary only contributes
  // the nights that actually fall inside the period.
  const computeOccupancyForRange = (startDate: string, endDateExclusive: string) => {
    const roomCount = db.prepare("SELECT COUNT(*) as count FROM rooms").get() as { count: number };

    const bookedRow = db.prepare(`
      SELECT COALESCE(SUM(
        MAX(0.0, MIN(julianday(check_out), julianday(?)) - MAX(julianday(check_in), julianday(?)))
      ), 0) as nights
      FROM bookings
      WHERE status NOT IN ('cancelled', 'rejected', 'no-show')
        AND is_archived = 0
        AND check_out > ?
        AND check_in < ?
    `).get(endDateExclusive, startDate, startDate, endDateExclusive) as { nights: number };

    const totalDays = differenceInDays(parseISO(endDateExclusive), parseISO(startDate));
    const bookedRoomNights = bookedRow.nights || 0;
    const availableRoomNights = roomCount.count * totalDays;

    return {
      booked_room_nights: Math.round(bookedRoomNights * 100) / 100,
      available_room_nights: availableRoomNights,
      occupancy_rate: availableRoomNights > 0 ? bookedRoomNights / availableRoomNights : 0
    };
  };

  app.get("/api/analytics", isAdmin, (req, res) => {
    try {
      // Only include revenue from bookings that are 'Fully Paid'
      const revenue = db.prepare(`
        SELECT COALESCE(
          (SELECT SUM(p.amount) 
           FROM payments p 
           JOIN bookings b ON p.booking_id = b.id 
           WHERE b.payment_status = 'Fully Paid'), 0
        ) + COALESCE(
          (SELECT SUM(amount_paid + COALESCE(balance_amount_paid, 0)) 
           FROM amenity_bookings 
           WHERE payment_status = 'Fully Paid'), 0
        ) as total
      `).get() as { total: number };
      
      const monthlyRevenue = db.prepare(`
        SELECT COALESCE(
          (SELECT SUM(p.amount) 
           FROM payments p 
           JOIN bookings b ON p.booking_id = b.id 
           WHERE b.payment_status = 'Fully Paid' AND strftime('%Y-%m', p.created_at) = strftime('%Y-%m', 'now')), 0
        ) + COALESCE(
          (SELECT SUM(amount_paid + COALESCE(balance_amount_paid, 0)) 
           FROM amenity_bookings 
           WHERE payment_status = 'Fully Paid' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')), 0
        ) as total
      `).get() as { total: number };
      
      const bookingCount = db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number };
      const amenityBookingCount = db.prepare("SELECT COUNT(*) as count FROM amenity_bookings").get() as { count: number };
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'guest'").get() as { count: number };
      const roomCount = db.prepare("SELECT COUNT(*) as count FROM rooms").get() as { count: number };

      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd');
      const occupancy = computeOccupancyForRange(monthStart, monthEnd);

      res.json({
        revenue: revenue.total || 0,
        monthly_revenue: monthlyRevenue.total || 0,
        bookings: bookingCount.count,
        amenity_bookings: amenityBookingCount.count,
        users: userCount.count,
        rooms: roomCount.count,
        occupancy_rate: occupancy.occupancy_rate,
        booked_room_nights: occupancy.booked_room_nights,
        available_room_nights: occupancy.available_room_nights
      });
    } catch (e) {
      console.error("Fetch analytics error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/analytics/detailed", isAdmin, (req, res) => {
    try {
      const now = new Date();

      // Last 6 calendar months, oldest to newest, including the current month
      const months = Array.from({ length: 6 }, (_, idx) => {
        const monthDate = subMonths(startOfMonth(now), 5 - idx);
        return {
          key: format(monthDate, 'yyyy-MM'),
          label: format(monthDate, 'MMM yyyy'),
          start: format(monthDate, 'yyyy-MM-dd'),
          end: format(startOfMonth(addMonths(monthDate, 1)), 'yyyy-MM-dd')
        };
      });

      const revenueByMonthRows = db.prepare(`
        SELECT strftime('%Y-%m', dt) as month, SUM(amt) as revenue
        FROM (
          SELECT p.created_at as dt, p.amount as amt
          FROM payments p JOIN bookings b ON p.booking_id = b.id
          WHERE b.payment_status = 'Fully Paid'
          UNION ALL
          SELECT created_at as dt, (amount_paid + COALESCE(balance_amount_paid, 0)) as amt
          FROM amenity_bookings
          WHERE payment_status = 'Fully Paid'
        )
        WHERE dt >= ?
        GROUP BY month
      `).all(months[0].start) as { month: string; revenue: number }[];
      const revenueByMonth = new Map(revenueByMonthRows.map(r => [r.month, r.revenue || 0]));

      const revenueTrend = months.map(m => ({ month: m.label, revenue: revenueByMonth.get(m.key) || 0 }));

      const occupancyTrend = months.map(m => {
        const occ = computeOccupancyForRange(m.start, m.end);
        return {
          month: m.label,
          occupancy_rate: occ.occupancy_rate,
          booked_room_nights: occ.booked_room_nights,
          available_room_nights: occ.available_room_nights
        };
      });

      const roomTypeBreakdown = db.prepare(`
        SELECT r.type as type, COUNT(b.id) as bookings, COALESCE(SUM(b.total_price), 0) as revenue
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status NOT IN ('cancelled', 'rejected', 'no-show') AND b.is_archived = 0
        GROUP BY r.type
        ORDER BY revenue DESC
      `).all();

      const amenityBreakdown = db.prepare(`
        SELECT a.name as name,
          COUNT(ab.id) as bookings,
          COALESCE(SUM(ab.amount_paid + COALESCE(ab.balance_amount_paid, 0)), 0) as revenue,
          a.stock as stock
        FROM amenities a
        LEFT JOIN amenity_bookings ab ON ab.amenity_id = a.id AND ab.is_archived = 0
          AND ab.status NOT IN ('cancelled', 'rejected', 'no-show')
        GROUP BY a.id
        ORDER BY revenue DESC
      `).all();

      const paymentMethodBreakdown = db.prepare(`
        SELECT COALESCE(method, 'Unknown') as method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM payments
        GROUP BY method
        ORDER BY total DESC
      `).all();

      const bookingStatusBreakdown = db.prepare(`
        SELECT status, COUNT(*) as count
        FROM bookings
        WHERE is_archived = 0
        GROUP BY status
        ORDER BY count DESC
      `).all();

      res.json({
        revenueTrend,
        occupancyTrend,
        roomTypeBreakdown,
        amenityBreakdown,
        paymentMethodBreakdown,
        bookingStatusBreakdown
      });
    } catch (e) {
      console.error("Fetch detailed analytics error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Audit Logs: persistent record of Admin/Staff actions (booking status changes,
  // payment verification, staff/room/amenity edits, etc) - admin-only viewer.
  app.get("/api/audit-logs", isAdmin, (req, res) => {
    try {
      const { action, entityType, actorId, limit, offset } = req.query;
      const conditions: string[] = [];
      const params: any[] = [];

      if (action) {
        conditions.push("action = ?");
        params.push(action);
      }
      if (entityType) {
        conditions.push("entity_type = ?");
        params.push(entityType);
      }
      if (actorId) {
        conditions.push("actor_id = ?");
        params.push(actorId);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const pageLimit = Math.min(Math.max(parseInt(String(limit || '100'), 10) || 100, 1), 500);
      const pageOffset = Math.max(parseInt(String(offset || '0'), 10) || 0, 0);

      const logs = db.prepare(`
        SELECT * FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageLimit, pageOffset);

      const total = (db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...params) as { count: number }).count;

      res.json({ logs, total });
    } catch (e) {
      console.error("GET /api/audit-logs failed:", e);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/staff/create-manual", isAdmin, (req, res) => {
    const { firstName, lastName, workSchedule, position, role } = req.body;
    // Only 'staff' and 'housekeeping' can be assigned here; admin accounts are never created via this endpoint.
    const assignedRole = role === 'housekeeping' ? 'housekeeping' : 'staff';
    try {
      // Create a dummy username and password for manually added staff
      const username = `staff_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`;
      const password = bcrypt.hashSync("temporary_password", 10);
      const info = db.prepare("INSERT INTO users (username, password, first_name, last_name, role, schedule, position) VALUES (?, ?, ?, ?, ?, ?, ?)").run(username, password, firstName, lastName, assignedRole, workSchedule, position || (assignedRole === 'housekeeping' ? 'Housekeeping' : 'Staff'));
      const user = db.prepare("SELECT id, username, first_name, last_name, role, schedule, position FROM users WHERE id = ?").get(info.lastInsertRowid);
      logAuditAction(req, 'staff_created', 'user', info.lastInsertRowid as number, `${firstName} ${lastName}`, { role: assignedRole, position });
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", isAdmin, (req, res) => {
    const { firstName, lastName, schedule, position } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE users SET first_name = ?, last_name = ?, schedule = ?, position = ? WHERE id = ?")
        .run(firstName, lastName, schedule, position, id);
      logAuditAction(req, 'staff_updated', 'user', id, `${firstName} ${lastName}`, { position, schedule });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to update staff" });
    }
  });

  app.all("/api/*", (req, res) => {
    console.warn(`Unmatched API request: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("CRITICAL: Unhandled Express Error:", err);
    if (err.stack) {
      console.error("Stack trace:", err.stack);
    }
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: "Internal server error" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Automated Communication Logic
  const autoUpdateBookingStatuses = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Mark as 'completed' if check_out date has passed and they were confirmed or checked-in
      db.prepare(`
        UPDATE bookings
        SET status = 'completed'
        WHERE (status = 'confirmed' OR status = 'checked-in')
        AND check_out < ?
      `).run(today);

      // Rooms left occupied past their checkout date need cleaning before they can be rebooked.
      const autoCheckedOutRooms = db.prepare(`
        UPDATE rooms SET status = 'dirty'
        WHERE status = 'occupied'
        AND id IN (SELECT room_id FROM bookings WHERE status = 'completed' AND check_out < ?)
      `).run(today);
      if (autoCheckedOutRooms.changes > 0) {
        broadcast({ type: 'HOUSEKEEPING_UPDATED' });
        broadcast({ type: 'ROOMS_UPDATED' });
      }

      // 2. Mark as 'no-show' if they never checked in and the whole period has passed
      db.prepare(`
        UPDATE bookings 
        SET status = 'no-show' 
        WHERE (status = 'pending' OR status = 'pending_verification' OR status = 'confirmed') 
        AND check_out < ? 
      `).run(today);

      // Do same for amenity bookings
      db.prepare(`
        UPDATE amenity_bookings
        SET status = 'completed'
        WHERE (status = 'confirmed' OR status = 'checked-in')
        AND reservation_date < ?
      `).run(today);

      db.prepare(`
        UPDATE amenity_bookings 
        SET status = 'no-show' 
        WHERE (status = 'pending' OR status = 'pending_verification') 
        AND reservation_date < ?
      `).run(today);

    } catch (error) {
      console.error("Error in autoUpdateBookingStatuses:", error);
    }
  };

  const checkAutomatedMessages = async () => {
    try {
      const now = new Date();
      const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
      
      // 1. Pre-Arrival (24 hours before)
      const pendingPreArrival = db.prepare(`
        SELECT b.*, r.name as room_name, u.email as guest_email, u.first_name as guest_name
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.check_in = ? AND b.status = 'confirmed'
        AND b.id NOT IN (SELECT booking_id FROM automated_messages WHERE type = 'pre-arrival')
      `).all(tomorrow) as any[];

      for (const booking of pendingPreArrival) {
        try {
          await sendEmail(
            booking.guest_email, 
            "Welcome to Da Bali Resort!", 
            `Hi ${booking.guest_name},\n\nYour stay in ${booking.room_name} starts tomorrow. We look forward to seeing you!\n\nHouse Rules: ...`
          );
          db.prepare("INSERT INTO automated_messages (booking_id, type) VALUES (?, 'pre-arrival')").run(booking.id);
        } catch (err) {
          console.error("Failed to process pre-arrival email:", err);
        }
      }

      // 2. Post-Checkout (Just checked out)
      const pendingPostCheckout = db.prepare(`
        SELECT b.*, u.email as guest_email, u.first_name as guest_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.status = 'Completed'
        AND b.id NOT IN (SELECT booking_id FROM automated_messages WHERE type = 'post-checkout')
      `).all() as any[];

      for (const booking of pendingPostCheckout) {
        try {
          await sendEmail(
            booking.guest_email, 
            "Thank you for staying with us!", 
            `Hi ${booking.guest_name},\n\nThank you for choosing Da Bali Resort. We hope you enjoyed your stay!\n\nPlease rate your experience: ...`
          );
          db.prepare("INSERT INTO automated_messages (booking_id, type) VALUES (?, 'post-checkout')").run(booking.id);
        } catch (err) {
          console.error("Failed to process post-checkout email:", err);
        }
      }
    } catch (error) {
      console.error("Error in checkAutomatedMessages:", error);
    }
  };

  // Run every hour
  setInterval(() => {
    autoUpdateBookingStatuses();
    checkAutomatedMessages().catch(err => console.error("Interval automated messages check failed:", err));
  }, 60 * 60 * 1000);
  
  // Also run once on start
  autoUpdateBookingStatuses();
  checkAutomatedMessages().catch(err => console.error("Initial automated messages check failed:", err));

  const PORT = 3000;
  console.log(`Attempting to start server on port ${PORT}...`);
  
  const serverInstance = server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  serverInstance.on('error', (error: any) => {
    console.error('CRITICAL: Server error:', error);
  });

  // Handle server-side unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      console.error('Stack trace:', reason.stack);
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Uncaught Exception:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  });

  process.on('warning', (warning) => {
    console.warn('CRITICAL: Process Warning:', warning.name);
    console.warn(warning.message);
    console.warn(warning.stack);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
