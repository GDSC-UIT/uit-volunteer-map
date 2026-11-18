import { postSummaryDto, postDetailDto } from "../transport/read.js";
import type { PostReadFilters } from "@uit-volunteer-map/shared";
import { Campaign } from "../entities/Campaign.js";
import { AppDataSource } from "../db/data-source.js";
import { Post } from "../entities/Post.js";
import { Photo } from "../entities/Photo.js";
import { HttpError } from "../errors/HttpError.js";
import { Team } from "../entities/Team.js";
import { User } from "../entities/User.js";
import { HTTP_STATUS, POST_ERRORS, TEAM_ERRORS, RoleEnum, MEDIA_LIMITS, type JwtPayload } from "@uit-volunteer-map/shared";
import type { CreatePostInput, UpdatePostInput, CreatePostImageInput } from "../schemas/post.js";
import type { EntityManager } from 'typeorm';
import { lifecycleTransaction } from './lifecycleTransaction.js';

export class PostService {
  private postRepo = AppDataSource.getRepository(Post);
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
  private async getActiveTeam(teamId: number, manager = AppDataSource.manager) {
    const team = await manager.getRepository(Team).findOne({ where: { teamId, isDeleted: 0 }, relations: ["campaign"] });
    if (!team) throw new HttpError(TEAM_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    if (!team.campaign) throw new HttpError(TEAM_ERRORS.CAMPAIGN_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return team;
  }
  private async getActorProfile(actor: JwtPayload, manager: EntityManager) {
    return manager.getRepository(User).findOne({ where: { account: { accId: actor.accId }, isDeleted: 0 }, relations: ["team"] });
  }
  private async assertTeamAccess(team: Team, actor: JwtPayload, manager: EntityManager) {
    if (actor.role === RoleEnum.ADMIN) return;
    const user = await this.getActorProfile(actor, manager);
    if (actor.role !== RoleEnum.LEADER || user?.team?.teamId !== team.teamId) throw new HttpError(POST_ERRORS.FORBIDDEN_ACCESS, HTTP_STATUS.FORBIDDEN);
  }
  private async getWritablePost(id: number, actor: JwtPayload, manager: EntityManager) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(POST_ERRORS.INVALID_ID, HTTP_STATUS.BAD_REQUEST);
    const post = await manager.getRepository(Post).findOne({ where: { postId: id, isDeleted: 0 }, relations: ["team"] });
    if (!post || !post.team) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    await this.assertTeamAccess(await this.getActiveTeam(post.team.teamId, manager), actor, manager);
    return post;
  }
  async create(data: CreatePostInput, actor: JwtPayload) {
    return lifecycleTransaction(async manager => {
      const team = await this.getActiveTeam(data.teamId, manager);
      await this.assertTeamAccess(team, actor, manager);
      const author = await this.getActorProfile(actor, manager);
      if (!author) throw new HttpError(POST_ERRORS.AUTHOR_REQUIRED, HTTP_STATUS.FORBIDDEN);
      const repo = manager.getRepository(Post), photos = manager.getRepository(Photo);
      const saved = await repo.save(repo.create({
        title: data.title, content: data.content, latitude: data.coordinates?.latitude ?? null, longitude: data.coordinates?.longitude ?? null,
        team: { teamId: team.teamId }, author: { userId: author.userId }, isDeleted: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }));
      // Array order is authoritative; legacy first flags are normalized consistently.
      if (data.photos?.length) await photos.save(data.photos.map((photo, position) => photos.create({
        title: photo.title ?? undefined, imageUrl: photo.imageUrl, position, isFirstImage: position === 0 ? 1 : 0,
        uploadedAt: new Date().toISOString(), isDeleted: 0, post: { postId: saved.postId },
      })));
      return repo.findOneOrFail({ where: { postId: saved.postId }, relations: ['photos', 'team', 'author'] });
    });
  }
  async update(id: number, data: UpdatePostInput, actor: JwtPayload) {
    return lifecycleTransaction(async manager => {
      const post = await this.getWritablePost(id, actor, manager);
      if (data.title !== undefined) post.title = data.title;
      if (data.content !== undefined) post.content = data.content;
      if (data.coordinates !== undefined) {
        post.latitude = data.coordinates?.latitude ?? null; post.longitude = data.coordinates?.longitude ?? null;
      }
      post.updatedAt = new Date().toISOString();
      return manager.getRepository(Post).save(post);
    });
  }
  async delete(id: number, actor: JwtPayload) {
    return lifecycleTransaction(async manager => {
      const post = await this.getWritablePost(id, actor, manager); post.isDeleted = 1;
      return manager.getRepository(Post).save(post);
    });
  }
  async addPhoto(postId: number, data: CreatePostImageInput, actor: JwtPayload) {
    return lifecycleTransaction(async manager => {
      await this.getWritablePost(postId, actor, manager);
      const repo = manager.getRepository(Photo);
      const live = await repo.find({ where: { post: { postId }, isDeleted: 0 }, order: { position: 'ASC', photoId: 'ASC' } });
      if (live.length >= MEDIA_LIMITS.maxImages) throw new HttpError('Bài đăng đã đủ bốn ảnh.', 409);
      const first = data.isFirstImage === 1 || live.length === 0;
      // An explicit legacy first flag promotes the new image; otherwise append.
      for (let i = 0; i < live.length; i++) {
        await repo.update(live[i].photoId, { position: i + (first ? 1 : 0), isFirstImage: !first && i === 0 ? 1 : 0 });
      }
      return repo.save(repo.create({
        title: data.title ?? undefined, imageUrl: data.imageUrl, position: first ? 0 : live.length, isFirstImage: first ? 1 : 0,
        uploadedAt: new Date().toISOString(), isDeleted: 0, post: { postId },
      }));
    });
  }
}
