import { AppDataSource } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { LoginInput } from '../schemas/auth.js';
import { AUTH_ERRORS, HTTP_STATUS, type LoginResponse, type UserRole } from '@uit-volunteer-map/shared';
import { HttpError } from '../errors/HttpError.js';
import bcrypt from 'bcrypt';
import { jwtExpirySeconds } from '../config/jwt.js';
import jwt, { SignOptions } from 'jsonwebtoken';

export class AuthService {
  private accountRepo = AppDataSource.getRepository(Account);

  async login(data: LoginInput): Promise<LoginResponse> {
    const account = await this.accountRepo.findOne({
      where: { username: data.username, isDeleted: false },
      relations: ['role'],
    });

    if (!account) {
      throw new HttpError(AUTH_ERRORS.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      account.password
    );

    if (!isPasswordValid) {
      throw new HttpError(AUTH_ERRORS.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!account.role) {
      throw new HttpError(AUTH_ERRORS.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new HttpError(AUTH_ERRORS.JWT_SECRET_MISSING, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const options: SignOptions = {
      expiresIn: jwtExpirySeconds(),
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
