import {
  createEvent,
  deleteEvent,
  findEventById,
  listEvents,
  updateEvent,
} from "../models/event.model.js";
import { isValidUuid } from "../utils/validation.js";

const VALID_STATUSES = new Set(["draft", "published", "cancelled", "completed"]);

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parsePositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function getEvents(req, res, next) {
  try {
    const { status } = req.query;
    if (status !== undefined && !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        error: "status must be one of: draft, published, cancelled, completed",
      });
    }

    const events = await listEvents({ status });
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

export async function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function createEventHandler(req, res, next) {
  try {
    const body = req.body ?? {};
    const title = String(body.title || "").trim();
    const description =
      body.description !== undefined && body.description !== null
        ? String(body.description).trim()
        : null;
    const venue = String(body.venue || "").trim();
    const startsAt = parseDate(body.startsAt ?? body.starts_at);
    const endsAt = parseDate(body.endsAt ?? body.ends_at);
    const totalSeats = parsePositiveInt(body.totalSeats ?? body.total_seats);
    const status = body.status ?? "draft";

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!venue) {
      return res.status(400).json({ error: "venue is required" });
    }
    if (!startsAt || !endsAt) {
      return res
        .status(400)
        .json({ error: "Valid startsAt and endsAt timestamps are required" });
    }
    if (endsAt <= startsAt) {
      return res.status(400).json({ error: "endsAt must be after startsAt" });
    }
    if (!totalSeats) {
      return res
        .status(400)
        .json({ error: "totalSeats must be a positive integer" });
    }
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({
        error: "status must be one of: draft, published, cancelled, completed",
      });
    }

    const event = await createEvent({
      title,
      description,
      venue,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      totalSeats,
      status,
      createdBy: req.user.id,
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function updateEventHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const existing = await findEventById(id);
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    const body = req.body ?? {};
    const updates = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      updates.title = title;
    }

    if (body.description !== undefined) {
      updates.description =
        body.description === null ? null : String(body.description).trim();
    }

    if (body.venue !== undefined) {
      const venue = String(body.venue).trim();
      if (!venue) {
        return res.status(400).json({ error: "venue cannot be empty" });
      }
      updates.venue = venue;
    }

    const rawStartsAt = body.startsAt ?? body.starts_at;
    if (rawStartsAt !== undefined) {
      const startsAt = parseDate(rawStartsAt);
      if (!startsAt) {
        return res.status(400).json({ error: "Invalid startsAt timestamp" });
      }
      updates.startsAt = startsAt.toISOString();
    }

    const rawEndsAt = body.endsAt ?? body.ends_at;
    if (rawEndsAt !== undefined) {
      const endsAt = parseDate(rawEndsAt);
      if (!endsAt) {
        return res.status(400).json({ error: "Invalid endsAt timestamp" });
      }
      updates.endsAt = endsAt.toISOString();
    }

    const effectiveStart = new Date(updates.startsAt ?? existing.starts_at);
    const effectiveEnd = new Date(updates.endsAt ?? existing.ends_at);
    if (effectiveEnd <= effectiveStart) {
      return res.status(400).json({ error: "endsAt must be after startsAt" });
    }

    const rawTotalSeats = body.totalSeats ?? body.total_seats;
    if (rawTotalSeats !== undefined) {
      const totalSeats = parsePositiveInt(rawTotalSeats);
      if (!totalSeats) {
        return res
          .status(400)
          .json({ error: "totalSeats must be a positive integer" });
      }
      updates.totalSeats = totalSeats;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return res.status(400).json({
          error: "status must be one of: draft, published, cancelled, completed",
        });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const event = await updateEvent(id, updates);
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function deleteEventHandler(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const deleted = await deleteEvent(id);
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted", id: deleted.id });
  } catch (err) {
    next(err);
  }
}
