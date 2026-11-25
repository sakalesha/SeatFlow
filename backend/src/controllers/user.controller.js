import { listUsers, updateUserRole } from "../models/user.model.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ROLES = new Set(["user", "admin"]);

export async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }

    const updatedUser = await updateUserRole(id, role);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}
