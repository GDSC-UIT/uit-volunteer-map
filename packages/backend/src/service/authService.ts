import { AppDataSource } from "../db/data-source.js";
import { Account } from "../entities/Account.js";
import { LoginInput } from "../schemas/auth.js";
import { AUTH_ERRORS, type LoginResponse, type UserRole } from "@uit-volunteer-map/shared";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

export class AuthService {
  private accountRepo = AppDataSource.getRepository(Account);

  async login(data: LoginInput): Promise<LoginResponse> {
    const account = await this.accountRepo.findOne({
      where: { username: data.username },
      relations: ["role"],
    });

    if (!account) {
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      account.password
    );

    if (!isPasswordValid) {
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
    console.log('Current JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

    if (!JWT_SECRET) {
      throw new Error(AUTH_ERRORS.JWT_SECRET_MISSING);
    }

    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      {
        accId: account.accId,
        role: account.role.roleName,
      },
      JWT_SECRET,
      options
    );

    return {
      token,
      user: {
        accId: account.accId,
        username: account.username,
        role: account.role.roleName as UserRole,
      },
    };
  }
}
