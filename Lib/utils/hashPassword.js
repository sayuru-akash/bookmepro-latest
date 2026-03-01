import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

// Hash a password
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}