import {
  cancelBookingTransaction,
  createBookingsTransaction,
  getEventSeatMap,
  listAllBookings,
  listUserBookings,
} from "../models/booking.model.js";
import { isValidUuid } from "../utils/validation.js";

function parseSeatNumbers(body) {
  const rawList =
    body.seatNumbers ??
    body.seat_numbers ??
    (body.seatNumber !== undefined || body.seat_number !== undefined
      ? [body.seatNumber ?? body.seat_number]
      : null);

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return null;
  }

  const normalized = rawList.map((val) => Number(val));
  if (normalized.some((n) => !Number.isInteger(n) || n <= 0)) {
    return null;
  }

  return [...new Set(normalized)];
}

export async function getEventSeats(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const seatMap = await getEventSeatMap(id);
    if (!seatMap) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(seatMap);
  } catch (err) {
    next(err);
  }
}

export async function createBookingHandler(req, res, next) {
  try {
    const body = req.body ?? {};
    const eventId = body.eventId ?? body.event_id;
    const seatNumbers = parseSeatNumbers(body);

    if (!isValidUuid(eventId)) {
      return res.status(400).json({ error: "Valid eventId is required" });
    }
    if (!seatNumbers) {
      return res.status(400).json({
        error: "seatNumbers must be a non-empty array of positive integers",
      });
    }
    if (seatNumbers.length > 10) {
      return res
        .status(400)
        .json({ error: "You can book up to 10 seats per request" });
    }

    const bookings = await createBookingsTransaction({
      eventId,
      userId: req.user.id,
      seatNumbers,
    });

    res.status(201).json({ bookings });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await listUserBookings(req.user.id);
    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function getAllBookings(req, res, next) {
  try {
    const bookings = await listAllBookings();
    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
}

export async function cancelBookingHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid booking id" });
    }

    const booking = await cancelBookingTransaction({
      bookingId: id,
      actorId: req.user.id,
      isAdmin: req.user.role === "admin",
    });

    res.status(200).json({ booking });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}
