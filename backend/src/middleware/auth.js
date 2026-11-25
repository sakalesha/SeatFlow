import { findUserById } from "../models/user.model.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);
    if (!decoded?.sub) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (user.account_status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError" ||
      err.name === "NotBeforeError"
    ) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
