import { createUser, findUserByEmail } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export async function register(req, res, next) {
  try {
    const body = req.body ?? {};
    const rawFullName = body.fullName ?? body.full_name ?? "";
    const fullName = String(rawFullName).trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName) {
      return res.status(400).json({ error: "fullName is required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ fullName, email, passwordHash });
    const token = signToken({ sub: user.id, role: user.role });

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email is already registered" });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const body = req.body ?? {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.account_status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    const token = signToken({ sub: user.id, role: user.role });
    res.status(200).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  res.status(200).json({ user: req.user });
}
