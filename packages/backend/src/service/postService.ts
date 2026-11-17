import { postSummaryDto, postDetailDto } from "../transport/read.js";
import type { PostReadFilters } from "@uit-volunteer-map/shared";
import { Campaign } from "../entities/Campaign.js";
import { AppDataSource } from "../db/data-source.js";
import { Post } from "../entities/Post.js";
import { Photo } from "../entities/Photo.js";
import { HttpError } from "../errors/HttpError.js";
import { Team } from "../entities/Team.js";
import { User } from "../entities/User.js";
import { HTTP_STATUS, POST_ERRORS, TEAM_ERRORS, RoleEnum, type JwtPayload } from "@uit-volunteer-map/shared";
import {
  CreatePostInput,
  UpdatePostInput,
  CreatePostImageInput,
} from "../schemas/post.js";

export class PostService {
  private postRepo = AppDataSource.getRepository(Post);
  private photoRepo = AppDataSource.getRepository(Photo);

  private readQuery() {
    return this.postRepo.createQueryBuilder("post")
      .innerJoinAndSelect("post.team", "team", "team.isDeleted = :teamDeleted", { teamDeleted: 0 })
      .innerJoinAndSelect("team.campaign", "campaign")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.photos", "photos")
      .where("post.isDeleted = :deleted", { deleted: 0 });
  }

  async getAll(filters: PostReadFilters = {}) {
    if (filters.campaignId !== undefined && !await AppDataSource.getRepository(Campaign).existsBy({ campaignId: filters.campaignId })) {
      throw new HttpError(TEAM_ERRORS.CAMPAIGN_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (filters.teamId !== undefined) await this.getActiveTeam(filters.teamId);
    const query = this.readQuery();
    if (filters.teamId !== undefined) query.andWhere("team.teamId = :teamId", { teamId: filters.teamId });
    if (filters.campaignId !== undefined) query.andWhere("campaign.campaignId = :campaignId", { campaignId: filters.campaignId });
    return (await query.orderBy("post.postId", "ASC").getMany()).map(postSummaryDto);
  }

  async getOne(id: number) {
    const post = await this.readQuery().andWhere("post.postId = :id", { id }).getOne();
    if (!post) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return postDetailDto(post);
  }

  private async getActiveTeam(teamId: number) {
    const team = await AppDataSource.getRepository(Team).findOne({
      where: { teamId, isDeleted: 0 }, relations: ["campaign"],
    });
    if (!team) throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    if (!team.campaign) throw new HttpError(TEAM_ERRORS.CAMPAIGN_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return team;
  }

  private async getActorProfile(actor: JwtPayload) {
    return AppDataSource.getRepository(User).findOne({
      where: { account: { accId: actor.accId }, isDeleted: 0 }, relations: ["team"],
    });
  }

  private async assertTeamAccess(team: Team, actor: JwtPayload) {
    if (actor.role === RoleEnum.ADMIN) return;
    const user = await this.getActorProfile(actor);
    if (actor.role !== RoleEnum.LEADER || user?.team?.teamId !== team.teamId) {
      throw new HttpError(POST_ERRORS.FORBIDDEN_ACCESS, HTTP_STATUS.FORBIDDEN);
    }
  }

  private async getWritablePost(id: number, actor: JwtPayload) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new HttpError(POST_ERRORS.INVALID_ID, HTTP_STATUS.BAD_REQUEST);
    }
    const post = await this.postRepo.findOne({ where: { postId: id, isDeleted: 0 }, relations: ["team"] });
    if (!post || !post.team) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    const team = await this.getActiveTeam(post.team.teamId);
    await this.assertTeamAccess(team, actor);
    return post;
  }

  async create(data: CreatePostInput, actor: JwtPayload) {
    const team = await this.getActiveTeam(data.teamId);
    await this.assertTeamAccess(team, actor);
    const author = await this.getActorProfile(actor);
    if (!author) throw new HttpError(POST_ERRORS.AUTHOR_REQUIRED, HTTP_STATUS.FORBIDDEN);
    const newPost = this.postRepo.create({
      title: data.title,
      content: data.content,
      team: { teamId: team.teamId },
      author: { userId: author.userId },
      isDeleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const savedPost = await this.postRepo.save(newPost);

    if (data.photos && data.photos.length > 0) {
      const photosToCreate = data.photos.map((photo, index) =>
        this.photoRepo.create({
          title: photo.title ?? undefined,
          imageUrl: photo.imageUrl,
          uploadedAt: new Date().toISOString(),
          isFirstImage: photo.isFirstImage ?? (index === 0 ? 1 : 0),
          isDeleted: 0,
          post: { postId: savedPost.postId } as Photo["post"],
        })
      );
      await this.photoRepo.save(photosToCreate);
    }

    return await this.postRepo.findOne({
      where: { postId: savedPost.postId },
      relations: ["photos", "team", "author"],
    });
  }

  async update(id: number, data: UpdatePostInput, actor: JwtPayload) {
    const post = await this.getWritablePost(id, actor);
    if (data.title !== undefined) post.title = data.title;
    if (data.content !== undefined) post.content = data.content;
    post.updatedAt = new Date().toISOString();
    return await this.postRepo.save(post);
  }

  async delete(id: number, actor: JwtPayload) {
    const post = await this.getWritablePost(id, actor);
    post.isDeleted = 1;
    return await this.postRepo.save(post);
  }

  async addPhoto(postId: number, data: CreatePostImageInput, actor: JwtPayload) {
    await this.getWritablePost(postId, actor);
    const newPhoto = this.photoRepo.create({
      title: data.title ?? undefined,
      imageUrl: data.imageUrl,
      uploadedAt: new Date().toISOString(),
      isFirstImage: data.isFirstImage ?? undefined,
      isDeleted: 0,
      post: { postId } as Photo["post"],
    });
    return await this.photoRepo.save(newPhoto);
  }
}
