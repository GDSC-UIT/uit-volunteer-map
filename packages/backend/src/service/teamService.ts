import { teamDto } from "../transport/read.js";
import type { TeamReadFilters } from "@uit-volunteer-map/shared";
import { AppDataSource } from "../db/data-source.js";
import { Team } from "../entities/Team.js";
import { User } from "../entities/User.js";
import { Campaign } from "../entities/Campaign.js";
import { Attachment } from "../entities/Attachment.js";
import { CreateTeamInput, UpdateTeamInput, type AttachmentInput } from "../schemas/team.js";
import { HttpError } from "../errors/HttpError.js";
import { HTTP_STATUS, TEAM_ERRORS, RoleEnum, type JwtPayload } from "@uit-volunteer-map/shared";
import type { EntityManager } from 'typeorm';
import { Post } from '../entities/Post.js';
import { lifecycleTransaction } from './lifecycleTransaction.js';

export class TeamService {
  private teamRepo = AppDataSource.getRepository(Team);
  private userRepo = AppDataSource.getRepository(User);
  private campaignRepo = AppDataSource.getRepository(Campaign);
  private attachmentRepo = AppDataSource.getRepository(Attachment);
  private readQuery(manager = AppDataSource.manager) {
    return manager.getRepository(Team).createQueryBuilder("team")
      .innerJoinAndSelect("team.campaign", "campaign")
      .leftJoinAndSelect("team.attachments", "attachments")
      .leftJoinAndSelect("team.users", "users")
      .leftJoinAndSelect("users.account", "account")
      .leftJoinAndSelect("account.role", "role")
      .leftJoinAndSelect("team.leader", "commander")
      .where("team.isDeleted = :deleted", { deleted: 0 });
  }
  private async readTeams(filters: TeamReadFilters = {}) {
    if (filters.campaignId !== undefined && !await this.campaignRepo.existsBy({ campaignId: filters.campaignId })) {
      throw new HttpError(TEAM_ERRORS.CAMPAIGN_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    const query = this.readQuery();
    if (filters.campaignId !== undefined) query.andWhere("campaign.campaignId = :campaignId", { campaignId: filters.campaignId });
    return query.orderBy("team.teamId", "ASC").getMany();
  }

  async getAll(filters: TeamReadFilters = {}) { return (await this.readTeams(filters)).map(teamDto); }
  async getManagementTeams(filters: TeamReadFilters = {}) {
    return (await this.readTeams(filters)).map(team => ({...teamDto(team),leaderId:team.leader?.userId ?? null}));
  }
  async getLeaderOptions() {
    const users = await this.userRepo.find({where:{isDeleted:0,account:{isDeleted:false,role:{roleName:RoleEnum.LEADER}}},relations:['account','account.role','team'],order:{userId:'ASC'}});
    const teams = await this.teamRepo.find({relations:['leader']});
    return users.map(user => ({userId:user.userId,fullName:user.fullName,assignedTeamId:user.team?.teamId ?? null,
      commandedTeamIds:teams.filter(team => team.leader?.userId === user.userId).map(team => team.teamId)}));
  }

  private async managementDto(manager: EntityManager, id: number) {
    const team = await this.readQuery(manager).andWhere('team.teamId = :id',{id}).getOneOrFail();
    return {...teamDto(team),leaderId:team.leader?.userId ?? null};
  }

  private async assignLeader(manager: EntityManager, teamId: number, leaderId: number | null) {
    const users = manager.getRepository(User), teams = manager.getRepository(Team);
    if (leaderId !== null) {
      const leader = await users.findOne({where:{userId:leaderId,isDeleted:0},relations:['account','account.role','team']});
      if (!leader || !leader.account || leader.account.isDeleted) throw new HttpError(TEAM_ERRORS.LEADER_NOT_FOUND,404);
      if (leader.account.role?.roleName !== RoleEnum.LEADER) throw new HttpError(TEAM_ERRORS.LEADER_INVALID_ROLE,400);
      const commands = await teams.find({where:{leader:{userId:leaderId}}});
      if ((leader.team && leader.team.teamId !== teamId) || commands.some(team => team.teamId !== teamId)) {
        throw new HttpError('Chỉ huy đang thuộc đội hình khác. Hãy gỡ phân công cũ trước.',409);
      }
    }
    const team = await teams.findOneOrFail({where:{teamId},relations:['leader']});
    const members = await users.find({where:{team:{teamId}},relations:['account','account.role']});
    for (const member of members) {
      if (member.userId !== leaderId && (member.userId === team.leader?.userId || member.account?.role?.roleName === RoleEnum.LEADER)) {
        await manager.createQueryBuilder().relation(User,'team').of(member.userId).set(null);
      }
    }
    await manager.createQueryBuilder().relation(Team,'leader').of(teamId).set(leaderId);
    if (leaderId !== null) await manager.createQueryBuilder().relation(User,'team').of(leaderId).set(teamId);
  }

  private async getTeamEntity(id: number) {
    const team = await this.teamRepo.findOne({
      where: { teamId: id, isDeleted: 0 },
      relations: ["leader", "users", "users.account", "users.account.role"],
    });

    if (!team) {
      throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return team;
  }

  async getOne(id: number) {
    const team = await this.readQuery().andWhere("team.teamId = :id", { id }).getOne();
    if (!team) throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return teamDto(team);
  }

  async getOwnTeam(actor: JwtPayload) {
    const user = await this.userRepo.findOne({
      where: { account: { accId: actor.accId }, isDeleted: 0 }, relations: ["team"],
    });
    if (!user?.team) throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return this.getOne(user.team.teamId);
  }

  async create(data: CreateTeamInput) {
    return lifecycleTransaction(async manager => {
      if (!await manager.getRepository(Campaign).existsBy({campaignId:data.campaignId})) throw new HttpError(TEAM_ERRORS.CAMPAIGN_NOT_FOUND,404);
      const repo = manager.getRepository(Team);
      if (await repo.existsBy({teamName:data.teamName})) throw new HttpError(TEAM_ERRORS.ALREADY_EXISTS,409);
      const team = await repo.save(repo.create({teamName:data.teamName,description:data.description,imageUrl:data.imageUrl,campaign:{campaignId:data.campaignId},isDeleted:0}));
      await this.assignLeader(manager,team.teamId,data.leaderId ?? null);
      if (data.attachments?.length) await manager.getRepository(Attachment).save(data.attachments.map((item,index) => ({imageUrl:item.imageUrl,position:item.position ?? index,uploadedAt:new Date().toISOString(),team:{teamId:team.teamId}})));
      return this.managementDto(manager,team.teamId);
    });
  }

  async delete(id: number) {
    return lifecycleTransaction(async manager => {
      const teams = manager.getRepository(Team);
      if (!await teams.existsBy({teamId:id,isDeleted:0})) throw new HttpError(TEAM_ERRORS.NOT_FOUND,404);
      if (await manager.getRepository(Post).existsBy({team:{teamId:id}}) || await manager.getRepository(Attachment).existsBy({team:{teamId:id}})) {
        throw new HttpError('Đội hình còn bài đăng hoặc ảnh đính kèm, không thể xóa.',409);
      }
      const members = await manager.getRepository(User).find({where:{team:{teamId:id}}});
      for (const member of members) await manager.createQueryBuilder().relation(User,'team').of(member.userId).set(null);
      await manager.createQueryBuilder().relation(Team,'leader').of(id).set(null);
      // Empty teams are physically deleted; FK constraints protect against concurrent linked writes.
      await teams.delete(id);
      return true;
    });
  }

  async update(id: number, data: UpdateTeamInput, currentUser: JwtPayload) {
    return lifecycleTransaction(async manager => {
      const repo = manager.getRepository(Team);
      const team = await repo.findOne({where:{teamId:id,isDeleted:0},relations:['campaign']});
      if (!team || !team.campaign) throw new HttpError(TEAM_ERRORS.NOT_FOUND,404);
      if (currentUser.role !== RoleEnum.ADMIN) {
        const actor = await manager.getRepository(User).findOne({where:{account:{accId:currentUser.accId},isDeleted:0},relations:['team']});
        if (currentUser.role !== RoleEnum.LEADER || actor?.team?.teamId !== id || data.leaderId !== undefined) throw new HttpError(TEAM_ERRORS.FORBIDDEN_ACCESS,403);
      }
      if (data.teamName && data.teamName !== team.teamName && await repo.existsBy({teamName:data.teamName})) throw new HttpError(TEAM_ERRORS.ALREADY_EXISTS,409);
      if (data.teamName !== undefined) team.teamName = data.teamName;
      if (data.description !== undefined) team.description = data.description;
      if (data.imageUrl !== undefined) team.imageUrl = data.imageUrl;
      await repo.save(team);
      if (data.leaderId !== undefined) await this.assignLeader(manager,id,data.leaderId);
      return this.managementDto(manager,id);
    });
  }

  async addAttachments(teamId: number, attachments: AttachmentInput[], currentUser: JwtPayload) {
    await this.getTeamEntity(teamId);

    if (currentUser.role === RoleEnum.LEADER) {
      const leaderUser = await this.userRepo.findOne({
        where: { account: { accId: currentUser.accId }, isDeleted: 0 },
        relations: ["team"],
      });

      if (!leaderUser || !leaderUser.team || leaderUser.team.teamId !== teamId) {
        throw new HttpError(TEAM_ERRORS.FORBIDDEN_ACCESS, HTTP_STATUS.FORBIDDEN);
      }
    }

    const existingAttachments = await this.attachmentRepo.find({
      where: { team: { teamId } },
      order: { position: "DESC" },
    });
    const maxPosition = existingAttachments.length > 0 
      ? (existingAttachments[0].position ?? 0) 
      : -1;

    const attachmentsToCreate = attachments.map((attachment, index) =>
      this.attachmentRepo.create({
        imageUrl: attachment.imageUrl,
        uploadedAt: new Date().toISOString(),
        position: attachment.position ?? (maxPosition + 1 + index),
        team: { teamId },
      })
    );

    const savedAttachments = await this.attachmentRepo.save(attachmentsToCreate);
    return savedAttachments;
  }

  async getTeamWithAttachments(teamId: number) {
    return this.getOne(teamId);
  }
}
