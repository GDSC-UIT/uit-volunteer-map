import bcrypt from 'bcrypt';
import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { User } from '../entities/User.js';
import { Team } from '../entities/Team.js';
import { Role } from '../entities/Role.js';
import { RoleEnum, type LeaderAccountReadDto } from '@uit-volunteer-map/shared';
import type { CreateAccountInput, UpdateAccountInput } from '../schemas/account.js';
import { HttpError } from '../errors/HttpError.js';
import { lifecycleTransaction } from './lifecycleTransaction.js';

export class AccountService {
  private async account(id: number, manager = AppDataSource.manager) {
    const account = await manager.getRepository(Account).findOne({
      where: {accId:id,role:{roleName:RoleEnum.LEADER}},
      relations: ['role','user','user.team','user.team.campaign'],
    });
    if (!account) throw new HttpError('Không tìm thấy tài khoản chỉ huy.',404);
    return account;
  }

  private dto(account: Account, teams: Team[]): LeaderAccountReadDto {
    const user = account.user, team = user?.team;
    return {
      accId:account.accId,username:account.username,role:RoleEnum.LEADER,active:!account.isDeleted,
      createdAt:account.createdAt ?? null,updatedAt:account.updatedAt ?? null,
      profile:user ? {userId:user.userId,fullName:user.fullName,mssv:user.mssv ?? null,class:user.class ?? null,
        email:user.email,phoneNumber:user.phoneNumber ?? null,active:user.isDeleted === 0} : null,
      team:team ? {teamId:team.teamId,teamName:team.teamName,campaignId:team.campaign?.campaignId ?? null,
        campaignName:team.campaign?.campaignName ?? null,active:team.isDeleted === 0 && !!team.campaign} : null,
      commandedTeamIds:user ? teams.filter(item=>item.leader?.userId === user.userId).map(item=>item.teamId) : [],
    };
  }
  private async read(id: number, manager = AppDataSource.manager) {
    const account = await this.account(id,manager);
    const teams = await manager.getRepository(Team).find({relations:['leader'],order:{teamId:'ASC'}});
    return this.dto(account,teams);
  }
  async getAllAccounts() {
    const accounts = await AppDataSource.getRepository(Account).find({where:{role:{roleName:RoleEnum.LEADER}},
      relations:['role','user','user.team','user.team.campaign'],order:{accId:'ASC'}});
    const teams = await AppDataSource.getRepository(Team).find({relations:['leader'],order:{teamId:'ASC'}});
    return accounts.map(account=>this.dto(account,teams));
  }
  async getAccountInfo(id: number) { return this.read(id); }

  private async assertEmail(manager: EntityManager, email: string, userId?: number) {
    const existing = await manager.getRepository(User).createQueryBuilder('profile')
      .where('LOWER(profile.email) = :email',{email}).getOne();
    if (existing && existing.userId !== userId) throw new HttpError('Email đã được sử dụng, kể cả hồ sơ lưu trữ.',409);
  }
  async createAccount(data: CreateAccountInput) {
    const password = await bcrypt.hash(data.password,10);
    return lifecycleTransaction(async manager=>{
      const repo = manager.getRepository(Account);
      if (await repo.existsBy({username:data.username})) throw new HttpError('Tên tài khoản đã tồn tại, kể cả tài khoản đã vô hiệu hóa.',409);
      await this.assertEmail(manager,data.email);
      const role = await manager.getRepository(Role).findOneBy({roleName:RoleEnum.LEADER});
      if (!role) throw new HttpError('Vai trò Leader chưa được cấu hình.',409);
      const now = new Date().toISOString();
      const account = await repo.save(repo.create({username:data.username,password,role,createdAt:now,updatedAt:now,isDeleted:false}));
      const users = manager.getRepository(User);
      await users.save(users.create({account:{accId:account.accId},fullName:data.fullname,mssv:data.mssv,
        class:data.class,email:data.email,phoneNumber:data.phoneNumber,isDeleted:0}));
      return this.read(account.accId,manager);
    });
  }
  async updateAccount(id: number, data: UpdateAccountInput) {
    const password = data.password === undefined ? undefined : await bcrypt.hash(data.password,10);
    return lifecycleTransaction(async manager=>{
      const account = await this.account(id,manager);
      if (account.isDeleted) throw new HttpError('Tài khoản đã vô hiệu hóa; không thể chỉnh sửa.',409);
      let user = account.user;
      if (user && user.isDeleted !== 0) throw new HttpError('Hồ sơ đã lưu trữ; cần xử lý dữ liệu trước khi chỉnh sửa.',409);
      if (data.email !== undefined) await this.assertEmail(manager,data.email,user?.userId);
      if (!user) {
        if (data.fullname === undefined || data.email === undefined || typeof data.mssv !== 'string' || typeof data.class !== 'string' || typeof data.phoneNumber !== 'string') {
          throw new HttpError('Vui lòng bổ sung đầy đủ hồ sơ trước khi lưu.',409);
        }
        user = manager.getRepository(User).create({account:{accId:id},fullName:data.fullname,email:data.email,mssv:data.mssv,class:data.class,phoneNumber:data.phoneNumber,isDeleted:0});
      }
      if (data.fullname !== undefined) user.fullName = data.fullname;
      if (data.email !== undefined) user.email = data.email;
      if (data.mssv !== undefined) user.mssv = data.mssv;
      if (data.class !== undefined) user.class = data.class;
      if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
      await manager.getRepository(User).save(user);
      if (password !== undefined) account.password = password;
      account.updatedAt = new Date().toISOString();
      // Save only Account scalars: profile writes above are explicit and transactional.
      await manager.getRepository(Account).update(id,{password:account.password,updatedAt:account.updatedAt});
      return this.read(id,manager);
    });
  }
  async softDeleteAccount(id: number) {
    return lifecycleTransaction(async manager=>{
      const account = await this.account(id,manager);
      if (account.user) {
        const userId = account.user.userId;
        await manager.createQueryBuilder().relation(User,'team').of(userId).set(null);
        const teams = await manager.getRepository(Team).find({where:{leader:{userId}}});
        for (const team of teams) await manager.createQueryBuilder().relation(Team,'leader').of(team.teamId).set(null);
      }
      await manager.getRepository(Account).update(id,{isDeleted:true,updatedAt:new Date().toISOString()});
      return this.read(id,manager);
    });
  }
}
