import pool from "../db/index.js";

const BOOKING_COLUMNS =
  "id, event_id, user_id, seat_number, status, created_at, updated_at";

class BookingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function getEventSeatMap(eventId) {
  const eventResult = await pool.query(
    "SELECT id, title, venue, starts_at, ends_at, total_seats, status FROM events WHERE id = $1",
    [eventId]
  );
  const event = eventResult.rows[0];
  if (!event) {
    return null;
  }

  const seatsResult = await pool.query(
    `SELECT seat_number
     FROM bookings
     WHERE event_id = $1 AND status = 'confirmed'
     ORDER BY seat_number ASC`,
    [eventId]
  );

  return {
    event,
    bookedSeats: seatsResult.rows.map((row) => row.seat_number),
  };
}

export async function createBookingsTransaction({ eventId, userId, seatNumbers }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      "SELECT id, title, total_seats, status FROM events WHERE id = $1 FOR UPDATE",
      [eventId]
    );
    const event = eventResult.rows[0];

    if (!event) {
      throw new BookingError(404, "Event not found");
    }
    if (event.status !== "published") {
      throw new BookingError(400, "Only published events can be booked");
    }

    const outOfRange = seatNumbers.filter((n) => n > event.total_seats);
    if (outOfRange.length > 0) {
      throw new BookingError(
        400,
        `Seat number(s) exceed event capacity (${event.total_seats}): ${outOfRange.join(", ")}`
      );
    }

    const conflictResult = await client.query(
      `SELECT seat_number
       FROM bookings
       WHERE event_id = $1 AND status = 'confirmed' AND seat_number = ANY($2::int[])
       ORDER BY seat_number ASC`,
      [eventId, seatNumbers]
    );

    if (conflictResult.rows.length > 0) {
      const taken = conflictResult.rows.map((r) => r.seat_number).join(", ");
      throw new BookingError(409, `Seat(s) already booked: ${taken}`);
    }

    const insertResult = await client.query(
      `INSERT INTO bookings (event_id, user_id, seat_number)
       SELECT $1, $2, seat
       FROM UNNEST($3::int[]) AS seat
       RETURNING ${BOOKING_COLUMNS}`,
      [eventId, userId, seatNumbers]
    );

    await client.query("COMMIT");
    return insertResult.rows;
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      throw new BookingError(409, "One or more selected seats are already booked");
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function listUserBookings(userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.event_id,
       b.user_id,
       b.seat_number,
       b.status,
       b.created_at,
       b.updated_at,
       e.title AS event_title,
       e.venue AS event_venue,
       e.starts_at AS event_starts_at,
       e.ends_at AS event_ends_at,
       e.status AS event_status
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC, b.seat_number ASC`,
    [userId]
  );
  return result.rows;
}

export async function listAllBookings() {
  const result = await pool.query(
    `SELECT
       b.id,
       b.event_id,
       b.user_id,
       b.seat_number,
       b.status,
       b.created_at,
       b.updated_at,
       e.title AS event_title,
       e.venue AS event_venue,
       e.starts_at AS event_starts_at,
       u.full_name AS user_name,
       u.email AS user_email
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC`
  );
  return result.rows;
}

export async function cancelBookingTransaction({ bookingId, actorId, isAdmin }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    const booking = existingResult.rows[0];

    if (!booking) {
      throw new BookingError(404, "Booking not found");
    }
    if (!isAdmin && booking.user_id !== actorId) {
      throw new BookingError(403, "Forbidden: you cannot cancel another user's booking");
    }
    if (booking.status === "cancelled") {
      throw new BookingError(400, "Booking is already cancelled");
    }

    const updatedResult = await client.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING ${BOOKING_COLUMNS}`,
      [bookingId]
    );

    await client.query("COMMIT");
    return updatedResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
