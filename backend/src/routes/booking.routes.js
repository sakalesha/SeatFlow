import { Router } from "express";
import {
  cancelBookingHandler,
  createBookingHandler,
  getAllBookings,
  getMyBookings,
} from "../controllers/booking.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticate, getMyBookings);
router.get("/", authenticate, authorize("admin"), getAllBookings);
router.post("/", authenticate, createBookingHandler);
router.patch("/:id/cancel", authenticate, cancelBookingHandler);

export default router;
