import pool from "../db/index.js";

const EVENT_COLUMNS =
  "id, title, description, venue, starts_at, ends_at, total_seats, status, created_by, created_at, updated_at";

const UPDATABLE_COLUMN_MAP = {
  title: "title",
  description: "description",
  venue: "venue",
  startsAt: "starts_at",
  endsAt: "ends_at",
  totalSeats: "total_seats",
  status: "status",
};

export async function createEvent({
  title,
  description,
  venue,
  startsAt,
  endsAt,
  totalSeats,
  status = "draft",
  createdBy,
}) {
  const result = await pool.query(
    `INSERT INTO events (title, description, venue, starts_at, ends_at, total_seats, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${EVENT_COLUMNS}`,
    [title, description ?? null, venue, startsAt, endsAt, totalSeats, status, createdBy]
  );
  return result.rows[0];
}

export async function listEvents({ status } = {}) {
  if (status) {
    const result = await pool.query(
      `SELECT ${EVENT_COLUMNS} FROM events WHERE status = $1 ORDER BY starts_at ASC`,
      [status]
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT ${EVENT_COLUMNS} FROM events ORDER BY starts_at ASC`
  );
  return result.rows;
}

export async function findEventById(id) {
  const result = await pool.query(
    `SELECT ${EVENT_COLUMNS} FROM events WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateEvent(id, updates) {
  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(UPDATABLE_COLUMN_MAP)) {
    if (updates[key] !== undefined) {
      values.push(updates[key]);
      setClauses.push(`${column} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return findEventById(id);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE events
     SET ${setClauses.join(", ")}
     WHERE id = $${values.length}
     RETURNING ${EVENT_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteEvent(id) {
  const result = await pool.query(
    "DELETE FROM events WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}
