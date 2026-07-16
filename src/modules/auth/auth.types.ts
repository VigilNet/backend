import type { User } from "../../db/schema/index.js";

export type AuthUser = Pick<User, "id" | "email" | "fullName" | "role" | "createdAt">;

export type RegisterInput = {
  email: string;
  fullName: string;
  password: string;
  role?: "ADMIN" | "PARTICIPANT";
};

export type LoginInput = {
  email: string;
  password: string;
};

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };
}
