import { AppDataSource } from "../db/data-source.js";
import { Team } from "../entities/Team.js";
import { User } from "../entities/User.js";
import { Campaign } from "../entities/Campaign.js";
import { Attachment } from "../entities/Attachment.js";
import {
  CreateTeamInput,
  UpdateTeamInput,
  type AttachmentInput,
} from "../schemas/team.js";
import { HttpError } from "../errors/HttpError.js";
import {
  HTTP_STATUS,
  TEAM_ERRORS,
  RoleEnum,
  type JwtPayload,
} from "@uit-volunteer-map/shared";

export class TeamService {
  private teamRepo = AppDataSource.getRepository(Team);
  private userRepo = AppDataSource.getRepository(User);
  private campaignRepo = AppDataSource.getRepository(Campaign);
  private attachmentRepo = AppDataSource.getRepository(Attachment);
  async getAll() {
    const teams = await this.teamRepo.find({
      where: { isDeleted: 0 },
      relations: [
        "users",
        "users.account",
        "users.account.role",
        "attachments",
      ],
    });

    return teams.map((team) => this.formatTeamResponse(team));
  }

  // Get teams by campaign ID
  async getTeamsByCampaign(campaignId: number) {
    const campaign = await this.campaignRepo.findOne({
      where: { campaignId },
    });

    if (!campaign) {
      throw new HttpError(
        TEAM_ERRORS.CAMPAIGN_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const teams = await this.teamRepo.find({
      where: { isDeleted: 0, campaign: { campaignId } },
      relations: [
        "users",
        "users.account",
        "users.account.role",
        "attachments",
      ],
    });

    return teams.map((team) => this.formatTeamResponse(team));
  }

  // Unified response format for all GET endpoints
  private formatTeamResponse(team: Team) {
    const leaders = team.users.filter(
      (u) => u.isDeleted === 0 && u.account?.role?.roleName === RoleEnum.LEADER,
    );
    const viceLeaders = team.users.filter(
      (u) =>
        u.isDeleted === 0 && u.account?.role?.roleName === RoleEnum.VICELEADER,
    );

    const mainLeader = leaders[0] || null;

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      description: team.description,
      leader: mainLeader
        ? {
            name: mainLeader.fullName,
            avatarUrl: mainLeader.avatarUrl || null,
          }
        : null,
      viceLeaders: viceLeaders.map((v) => ({
        name: v.fullName,
        avatarUrl: v.avatarUrl || null,
      })),
      images:
        team.attachments
          ?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((att) => att.imageUrl) || [],
    };
  }

  private async getTeamEntity(id: number) {
    const team = await this.teamRepo.findOne({
      where: { teamId: id, isDeleted: 0 },
      relations: [
        "users",
        "users.account",
        "users.account.role",
        "attachments",
      ],
    });

    if (!team) {
      throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return team;
  }

  async getOne(id: number) {
    const team = await this.getTeamEntity(id);
    return this.formatTeamResponse(team);
  }

  async create(data: CreateTeamInput) {
    const campaign = await this.campaignRepo.findOne({
      where: { campaignId: data.campaignId },
    });
    if (!campaign) {
      throw new HttpError(
        TEAM_ERRORS.CAMPAIGN_NOT_FOUND,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existing = await this.teamRepo.findOne({
      where: {
        teamName: data.teamName,
        campaign: { campaignId: data.campaignId },
      },
    });

    if (existing) {
      throw new HttpError(TEAM_ERRORS.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    const leader = await this.userRepo.findOne({
      where: { userId: data.leaderId, isDeleted: 0 },
      relations: ["account", "account.role"],
    });

    if (!leader) {
      throw new HttpError(TEAM_ERRORS.LEADER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (leader.account?.role?.roleName !== RoleEnum.LEADER) {
      throw new HttpError(
        TEAM_ERRORS.LEADER_INVALID_ROLE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const newTeam = this.teamRepo.create({
      teamName: data.teamName,
      description: data.description,
      leader: { userId: data.leaderId } as any,
      imageUrl: data.imageUrl,
      campaign: { campaignId: data.campaignId } as any,
      isDeleted: 0,
    });

    const savedTeam = await this.teamRepo.save(newTeam);

    if (data.attachments && data.attachments.length > 0) {
      const attachmentsToCreate = data.attachments.map((attachment, index) =>
        this.attachmentRepo.create({
          imageUrl: attachment.imageUrl,
          uploadedAt: new Date().toISOString(),
          position: attachment.position ?? index,
          team: { teamId: savedTeam.teamId } as any,
        }),
      );
      await this.attachmentRepo.save(attachmentsToCreate);
    }

    return await this.teamRepo.findOne({
      where: { teamId: savedTeam.teamId },
      relations: ["attachments", "leader"],
    });
  }

  async delete(id: number) {
    const team = await this.getTeamEntity(id);

    team.isDeleted = 1;
    await this.teamRepo.save(team);
    const users = await this.userRepo.find({
      where: { team: { teamId: id }, isDeleted: 0 },
    });
    for (const user of users) {
      user.isDeleted = 1;
      await this.userRepo.save(user);
    }

    return true;
  }

  async update(id: number, data: UpdateTeamInput, currentUser: JwtPayload) {
    const team = await this.getTeamEntity(id);

    if (
      currentUser.role === RoleEnum.LEADER ||
      currentUser.role === RoleEnum.VICELEADER
    ) {
      const leaderUser = await this.userRepo.findOne({
        where: { account: { accId: currentUser.accId }, isDeleted: 0 },
        relations: ["team"],
      });

      if (!leaderUser || !leaderUser.team || leaderUser.team.teamId !== id) {
        throw new HttpError(
          TEAM_ERRORS.FORBIDDEN_ACCESS,
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }

    if (data.teamName) {
      team.teamName = data.teamName;
    }
    if (data.description !== undefined) {
      team.description = data.description;
    }
    if (data.imageUrl !== undefined) {
      team.imageUrl = data.imageUrl;
    }

    return await this.teamRepo.save(team);
  }

  async addAttachments(
    teamId: number,
    attachments: AttachmentInput[],
    currentUser: JwtPayload,
  ) {
    await this.getTeamEntity(teamId);

    if (
      currentUser.role === RoleEnum.LEADER ||
      currentUser.role === RoleEnum.VICELEADER
    ) {
      const leaderUser = await this.userRepo.findOne({
        where: { account: { accId: currentUser.accId }, isDeleted: 0 },
        relations: ["team"],
      });

      if (
        !leaderUser ||
        !leaderUser.team ||
        leaderUser.team.teamId !== teamId
      ) {
        throw new HttpError(
          TEAM_ERRORS.FORBIDDEN_ACCESS,
          HTTP_STATUS.FORBIDDEN,
        );
      }
    }

    const existingAttachments = await this.attachmentRepo.find({
      where: { team: { teamId } },
      order: { position: "DESC" },
    });
    const maxPosition =
      existingAttachments.length > 0
        ? existingAttachments[0].position ?? 0
        : -1;

    const attachmentsToCreate = attachments.map((attachment, index) =>
      this.attachmentRepo.create({
        imageUrl: attachment.imageUrl,
        uploadedAt: new Date().toISOString(),
        position: attachment.position ?? maxPosition + 1 + index,
        team: { teamId } as any,
      }),
    );

    const savedAttachments = await this.attachmentRepo.save(
      attachmentsToCreate,
    );
    return savedAttachments;
  }

  async getTeamWithAttachments(teamId: number) {
    const team = await this.teamRepo.findOne({
      where: { teamId, isDeleted: 0 },
      relations: ["attachments", "leader"],
    });

    if (!team) {
      throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return team;
  }
}
