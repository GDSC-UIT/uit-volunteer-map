import { AppDataSource } from '../db/data-source.js';
import { Post } from '../entities/Post.js';
import { HttpError } from '../errors/HttpError.js';
import { HTTP_STATUS, POST_ERRORS } from '@uit-volunteer-map/shared';
import { CreatePostInput, UpdatePostInput } from '../schemas/post.js';

export class PostService {
    private postRepo = AppDataSource.getRepository(Post);

    async getAll() {
        const posts = await this.postRepo.find();
        return posts.filter(post => post.isDeleted === 0 && post.status === 'ACTIVE');
    }

    async getOne(id: number) {
        const post = await this.postRepo.findOneBy({ postId: id });
        if (!post || post.isDeleted === 1) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        if (post.status !== 'ACTIVE') throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        return post;
    }

    async create(data: CreatePostInput) {
        const newPost = this.postRepo.create(data);
        newPost.status = 'draft';
        newPost.isDeleted = 0;
        newPost.createdAt = new Date().toISOString();
        newPost.updatedAt = new Date().toISOString();
        return await this.postRepo.save(newPost);
    }

    async update(id: number, data: UpdatePostInput) {
        const post = await this.getOne(id);
        if (!post || post.isDeleted === 1) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        this.postRepo.merge(post, data);
        post.updatedAt = new Date().toISOString();
        return await this.postRepo.save(post);
    }

    async delete(id: number) {
        const post = await this.getOne(id);
        if (!post || post.isDeleted === 1) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        post.isDeleted = 1;
        return await this.postRepo.save(post);
    }

    async approve(id: number) {
        const post = await this.getOne(id);
        if (!post || post.isDeleted === 1) throw new HttpError(POST_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        post.status = 'ACTIVE';
        return await this.postRepo.save(post);
    }
}
