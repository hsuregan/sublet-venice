import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "rental.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      introduction TEXT NOT NULL,
      referral TEXT,
      total_price REAL NOT NULL,
      nightly_breakdown TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      booking_id INTEGER,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);
  `);

  // Seed defaults if settings is empty
  const count = db
    .prepare("SELECT COUNT(*) as c FROM settings")
    .get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
    );
    insert.run("daily_rate", JSON.stringify(150));
    insert.run("property_title", JSON.stringify("Charming Apartment in Venice"));
    insert.run(
      "property_description",
      JSON.stringify(
        "A beautifully appointed apartment in the heart of Venice, steps from the Grand Canal. Enjoy authentic Venetian living with modern comforts including a fully equipped kitchen, comfortable bedroom, and stunning views of the city."
      )
    );
    insert.run("available_date_ranges", JSON.stringify([]));
  }
}

// ----- Settings -----

export function getSetting(key: string): unknown {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : null;
}

export function getAllSettings(): Record<string, unknown> {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export function updateSetting(key: string, value: unknown) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, JSON.stringify(value));
}

// ----- Price Overrides -----

export interface PriceOverride {
  id: number;
  date: string;
  price: number;
}

export function getPriceOverrides(): PriceOverride[] {
  return getDb()
    .prepare("SELECT id, date, price FROM price_overrides ORDER BY date")
    .all() as PriceOverride[];
}

export function addPriceOverride(date: string, price: number) {
  getDb()
    .prepare(
      "INSERT INTO price_overrides (date, price) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET price = excluded.price"
    )
    .run(date, price);
}

export function deletePriceOverride(id: number) {
  getDb().prepare("DELETE FROM price_overrides WHERE id = ?").run(id);
}

// ----- Bookings -----

export interface Booking {
  id: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  introduction: string;
  referral: string | null;
  total_price: number;
  nightly_breakdown: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  created_at: string;
}

export function createBooking(data: {
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  introduction: string;
  referral?: string;
  total_price: number;
  nightly_breakdown: Record<string, number>;
}): number {
  const result = getDb()
    .prepare(
      `INSERT INTO bookings (check_in, check_out, guest_name, guest_email, guest_phone, introduction, referral, total_price, nightly_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.check_in,
      data.check_out,
      data.guest_name,
      data.guest_email,
      data.guest_phone,
      data.introduction,
      data.referral || null,
      data.total_price,
      JSON.stringify(data.nightly_breakdown)
    );
  return result.lastInsertRowid as number;
}

export function getBookings(status?: string): Booking[] {
  if (status) {
    return getDb()
      .prepare(
        "SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC"
      )
      .all(status) as Booking[];
  }
  return getDb()
    .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
    .all() as Booking[];
}

export function getBookingById(id: number): Booking | undefined {
  return getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(id) as Booking | undefined;
}

export function updateBookingStatus(
  id: number,
  status: "approved" | "denied" | "cancelled"
) {
  getDb()
    .prepare("UPDATE bookings SET status = ? WHERE id = ?")
    .run(status, id);
}

// ----- Blocked Dates -----

export function getBlockedDates(): { date: string; booking_id: number | null }[] {
  return getDb()
    .prepare("SELECT date, booking_id FROM blocked_dates ORDER BY date")
    .all() as { date: string; booking_id: number | null }[];
}

export function addBlockedDates(dates: string[], bookingId?: number) {
  const insert = getDb().prepare(
    "INSERT OR IGNORE INTO blocked_dates (date, booking_id) VALUES (?, ?)"
  );
  const transaction = getDb().transaction((dates: string[]) => {
    for (const date of dates) {
      insert.run(date, bookingId || null);
    }
  });
  transaction(dates);
}

export function removeBlockedDates(dates: string[]) {
  const remove = getDb().prepare(
    "DELETE FROM blocked_dates WHERE date = ?"
  );
  const transaction = getDb().transaction((dates: string[]) => {
    for (const date of dates) {
      remove.run(date);
    }
  });
  transaction(dates);
}

export function removeBlockedDatesByBookingId(bookingId: number) {
  getDb()
    .prepare("DELETE FROM blocked_dates WHERE booking_id = ?")
    .run(bookingId);
}

// ----- Password Reset -----

export function savePasswordResetToken(token: string, expiresAt: string) {
  updateSetting("password_reset_token", { token, expiresAt });
}

export function getPasswordResetToken(): { token: string; expiresAt: string } | null {
  return getSetting("password_reset_token") as { token: string; expiresAt: string } | null;
}

export function clearPasswordResetToken() {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run("password_reset_token");
}

export function saveAdminPasswordHash(hash: string) {
  updateSetting("admin_password_hash", hash);
}

export function getAdminPasswordHash(): string | null {
  return getSetting("admin_password_hash") as string | null;
}
