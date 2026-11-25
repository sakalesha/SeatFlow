import pool from "../db/index.js";

export const SAFE_USER_COLUMNS =
  "id, full_name, email, role, email_verified_at, account_status, created_at, updated_at";

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT ${SAFE_USER_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser({ fullName, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${SAFE_USER_COLUMNS}`,
    [fullName, email, passwordHash]
  );
  return result.rows[0];
}

export async function listUsers() {
  const result = await pool.query(
    `SELECT ${SAFE_USER_COLUMNS} FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function updateUserRole(id, role) {
  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${SAFE_USER_COLUMNS}`,
    [role, id]
  );
  return result.rows[0] || null;
}
