import { Router } from "express";
import { getEventSeats } from "../controllers/booking.controller.js";
import {
  createEventHandler,
  deleteEventHandler,
  getEventById,
  getEvents,
  updateEventHandler,
} from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id/seats", getEventSeats);
router.get("/:id", getEventById);
router.post("/", authenticate, authorize("admin"), createEventHandler);
router.patch("/:id", authenticate, authorize("admin"), updateEventHandler);
router.put("/:id", authenticate, authorize("admin"), updateEventHandler);
router.delete("/:id", authenticate, authorize("admin"), deleteEventHandler);

export default router;
