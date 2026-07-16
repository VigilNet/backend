import { HttpError } from "../../lib/http-error.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { AuthRepository } from "./auth.repository.js";
import type { AuthUser, LoginInput, RegisterInput } from "./auth.types.js";
import { toAuthUser } from "./auth.types.js";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    if (!input.email.includes("@")) {
      throw new HttpError(400, "Email is invalid");
    }

    if (input.fullName.trim().length === 0) {
      throw new HttpError(400, "Full name is required");
    }

    if (input.password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser) {
      throw new HttpError(409, "Email is already registered");
    }

    const user = await this.authRepository.create({
      email,
      fullName: input.fullName.trim(),
      passwordHash: await hashPassword(input.password),
      role: input.role ?? "PARTICIPANT",
    });

    return toAuthUser(user);
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const user = await this.authRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new HttpError(401, "Invalid email or password");
    }

    return toAuthUser(user);
  }

  async getById(id: string): Promise<AuthUser> {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return toAuthUser(user);
  }
}
