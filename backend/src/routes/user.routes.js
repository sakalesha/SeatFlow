import { Router } from "express";
import { changeUserRole, getUsers } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), getUsers);
router.patch("/:id/role", authenticate, authorize("admin"), changeUserRole);

export default router;
