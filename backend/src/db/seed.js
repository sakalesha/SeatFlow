import pool from "./index.js";
import logger from "../utils/logger.js";
import { hashPassword } from "../utils/password.js";

const SAMPLE_ADMIN = {
  fullName: "SeatFlow Admin",
  email: "admin@seatflow.dev",
  password: "Admin@123",
};

const SAMPLE_EVENTS = [
  {
    title: "SeatFlow Architecture Summit",
    description:
      "Full-day engineering conference covering high-concurrency reservation engines and spatial floorplan tooling.",
    venue: "Main Auditorium · Hall A",
    startsAt: "2026-12-05T10:00:00Z",
    endsAt: "2026-12-05T17:00:00Z",
    totalSeats: 240,
    status: "published",
  },
  {
    title: "Acoustic Sessions: Late Evening",
    description:
      "Intimate tiered seating showcase with reserved front-row acoustics and lounge intermission.",
    venue: "Studio Pavilion · Room 02",
    startsAt: "2026-12-12T19:30:00Z",
    endsAt: "2026-12-12T22:00:00Z",
    totalSeats: 85,
    status: "published",
  },
  {
    title: "Product Design Critique & Floorplan Lab",
    description:
      "Hands-on workshop reviewing venue accessibility, aisle spacing, and ticketing ergonomics.",
    venue: "Atrium Studio · West Wing",
    startsAt: "2026-12-18T14:00:00Z",
    endsAt: "2026-12-18T16:30:00Z",
    totalSeats: 48,
    status: "published",
  },
  {
    title: "Winter Town Hall & Q1 Roadmap",
    description:
      "Draft schedule pending final speaker lineup and stage North capacity confirmation.",
    venue: "Grand Hall · Stage North",
    startsAt: "2027-01-08T09:30:00Z",
    endsAt: "2027-01-08T12:00:00Z",
    totalSeats: 320,
    status: "draft",
  },
  {
    title: "Systems Reliability Roundtable",
    description:
      "Rescheduled to Q1; existing seat holds released for mezzanine maintenance.",
    venue: "Mezzanine Conference B",
    startsAt: "2026-12-22T15:00:00Z",
    endsAt: "2026-12-22T17:30:00Z",
    totalSeats: 60,
    status: "cancelled",
  },
  {
    title: "Autumn Engineering Open House",
    description:
      "Completed community showcase with full capacity check-in across Hall A.",
    venue: "Main Auditorium · Hall A",
    startsAt: "2026-11-10T11:00:00Z",
    endsAt: "2026-11-10T15:00:00Z",
    totalSeats: 180,
    status: "completed",
  },
];

async function ensureAdminUser() {
  const existing = await pool.query(
    "SELECT id, email FROM users WHERE email = $1",
    [SAMPLE_ADMIN.email]
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const passwordHash = await hashPassword(SAMPLE_ADMIN.password);
  const inserted = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, email_verified_at)
     VALUES ($1, $2, $3, 'admin', NOW())
     RETURNING id`,
    [SAMPLE_ADMIN.fullName, SAMPLE_ADMIN.email, passwordHash]
  );
  logger.info(`Seeded admin user: ${SAMPLE_ADMIN.email}`);
  return inserted.rows[0].id;
}

async function seedEvents(adminId) {
  let insertedCount = 0;

  for (const ev of SAMPLE_EVENTS) {
    const existing = await pool.query(
      "SELECT id FROM events WHERE title = $1 AND starts_at = $2",
      [ev.title, ev.startsAt]
    );
    if (existing.rows.length > 0) {
      continue;
    }

    await pool.query(
      `INSERT INTO events (title, description, venue, starts_at, ends_at, total_seats, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        ev.title,
        ev.description,
        ev.venue,
        ev.startsAt,
        ev.endsAt,
        ev.totalSeats,
        ev.status,
        adminId,
      ]
    );
    insertedCount += 1;
  }

  logger.info(`Seeded ${insertedCount} new sample event(s)`);
}

try {
  const adminId = await ensureAdminUser();
  await seedEvents(adminId);
} catch (err) {
  logger.error({ err }, "Seeding failed");
  process.exitCode = 1;
} finally {
  await pool.end();
}
