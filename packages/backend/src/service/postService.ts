import { AppDataSource } from "../db/data-source.js";
import { Post } from "../entities/Post.js";
import { Photo } from "../entities/Photo.js";
import { HttpError } from "../errors/HttpError.js";
import { HTTP_STATUS, POST_ERRORS } from "@uit-volunteer-map/shared";
import {
  CreatePostInput,
  UpdatePostInput,
  CreatePostImageInput,
} from "../schemas/post.js";

export class PostService {
  private postRepo = AppDataSource.getRepository(Post);
  private photoRepo = AppDataSource.getRepository(Photo);

  private formatPostResponse(post: Post) {
    const photos = post.photos?.filter((p) => p.isDeleted === 0) || [];
    return {
      postId: post.postId,
      title: post.title,
      content: post.content,
      photos: photos.map((p) => p.imageUrl),
      teamId: post.team?.teamId ?? null,
      createdAt: post.createdAt,
      location: post.location ?? null,
    };
  }

  async getAll() {
    const posts = await this.postRepo.find({
      where: { isDeleted: 0 },
      relations: ["photos", "team"],
      order: { createdAt: "DESC" },
    });

    return posts.map((post) => this.formatPostResponse(post));
  }

  async getByTeam(teamId: number) {
    const posts = await this.postRepo.find({
      where: { isDeleted: 0, team: { teamId } },
      relations: ["photos", "team"],
      order: { createdAt: "DESC" },
    });

    return posts.map((post) => this.formatPostResponse(post));
  }

  async getOne(id: number) {
    const post = await this.postRepo.findOne({
      where: { postId: id, isDeleted: 0 },
      relations: ["photos", "team"],
    });
    if (!post)
      throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return this.formatPostResponse(post);
  }

  async create(data: CreatePostInput) {
    const newPost = this.postRepo.create({
      title: data.title,
      content: data.content,
      location: data.location ?? null,
      team: { teamId: data.teamId },
      author: { userId: data.authorId },
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
        }),
      );
      await this.photoRepo.save(photosToCreate);
    }

    return await this.postRepo
      .findOne({
        where: { postId: savedPost.postId },
        relations: ["photos", "team"],
      })
      .then((p) => (p ? this.formatPostResponse(p) : null));
  }

  private async getPostEntity(id: number) {
    const post = await this.postRepo.findOne({
      where: { postId: id, isDeleted: 0 },
      relations: ["photos", "team"],
    });
    if (!post)
      throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return post;
  }

  async update(id: number, data: UpdatePostInput) {
    const post = await this.getPostEntity(id);

    if (data.title) post.title = data.title;
    if (data.content) post.content = data.content;
    if (data.location !== undefined) post.location = data.location;

    if (data.teamId) {
      post.team = { teamId: data.teamId } as Post["team"];
    }
    if (data.authorId) {
      post.author = { userId: data.authorId } as Post["author"];
    }

    post.updatedAt = new Date().toISOString();
    await this.postRepo.save(post);
    return this.formatPostResponse(post);
  }

  async delete(id: number) {
    const post = await this.getPostEntity(id);
    post.isDeleted = 1;
    await this.postRepo.save(post);
    return this.formatPostResponse(post);
  }

  async addPhoto(postId: number, data: CreatePostImageInput) {
    const post = await this.getPostEntity(postId);
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
