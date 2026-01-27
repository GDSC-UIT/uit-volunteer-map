import { AppDataSource } from '../db/data-source.js';
import { User } from '../entities/User.js';
import type { UpdateUserProfileInput } from '../schemas/userProfile.js';

export type UserProfileDto = {
  UserId: string;
  FullName: string;
  Mssv: string;
  Class: string;
  Email: string;
  PhoneNumber: string;
  created_at: string | null;
};

export class UserProfileService {
  private repo = AppDataSource.getRepository(User);

  private toDto(user: User): UserProfileDto {
    return {
      UserId: String(user.userId),
      FullName: user.fullName,
      Mssv: user.mssv ?? '',
      Class: user.class ?? '',
      Email: user.email,
      PhoneNumber: user.phoneNumber ?? '',
      created_at: user.account?.createdAt ?? null,
    };
  }

  async getUserProfile(accId: number): Promise<UserProfileDto> {
    const user = await this.repo.findOne({
      where: { account: { accId } },
      relations: { account: true },
    });

    if (!user) {
      const err = new Error(`User with ID ${accId} not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    return this.toDto(user);
  }

  async updateUserProfile(accId: number, data: UpdateUserProfileInput): Promise<UserProfileDto> {
    const user = await this.repo.findOne({
      where: { account: { accId } },
      relations: { account: true },
    });

    if (!user) {
      const err = new Error(`User with ID ${accId} not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const existed = await this.repo.findOne({ where: { email: data.Email } });
    if (existed && existed.userId !== user.userId) {
      const err = new Error(`Email '${data.Email}' is already taken.`);
      (err as any).statusCode = 409;
      throw err;
    }

    user.fullName = data.FullName;
    user.mssv = data.Mssv;
    user.class = data.Class;
    user.email = data.Email;
    user.phoneNumber = data.PhoneNumber;

    const saved = await this.repo.save(user);
    saved.account = user.account;

    return this.toDto(saved);
  }
}
