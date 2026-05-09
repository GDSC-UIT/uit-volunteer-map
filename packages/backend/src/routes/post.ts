import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { HttpError } from "../errors/HttpError.js";
import {
  RoleEnum,
  HTTP_STATUS,
  ERROR_MESSAGES,
  ApiResponse,
  Post,
  Photo,
  POST_MESSAGES,
  POST_ERRORS,
} from "@uit-volunteer-map/shared";
import { PostService } from "../service/postService.js";
import {
  createPostSchema,
  updatePostSchema,
  createPostImageSchema,
} from "../schemas/post.js";

const router = Router();
const postService = new PostService();

router.get("/", async (_req, res) => {
  try {
    const result = await postService.getAll();
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      return res.status(err.statusCode).json(response);
    }
    const response: ApiResponse<null> = {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await postService.getOne(Number(req.params.id));
    const response: ApiResponse<Post> = {
      success: true,
      data: result,
    };
    return res.status(HTTP_STATUS.OK).json(response);
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      return res.status(err.statusCode).json(response);
    }
    const response: ApiResponse<null> = {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

router.use(authenticateToken, requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]));

router.post("/", validate(createPostSchema), async (req, res) => {
  try {
    const result = await postService.create(req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: POST_MESSAGES.CREATED,
    });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      return res.status(err.statusCode).json(response);
    }
    const response: ApiResponse<null> = {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

router.post(
  "/:id/photos",
  validate(createPostImageSchema),
  async (req, res) => {
    try {
      const postId = Number(req.params.id);
      if (isNaN(postId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: POST_ERRORS.NOT_FOUND,
        };
        return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      }
      const result = await postService.addPhoto(postId, req.body);
      const response: ApiResponse<Photo> = {
        success: true,
        data: result,
      };
      return res.status(HTTP_STATUS.OK).json(response);
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        const response: ApiResponse<null> = {
          success: false,
          error: err.message,
        };
        return res.status(err.statusCode).json(response);
      }
      const response: ApiResponse<null> = {
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      };
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  },
);

router.put("/:id", validate(updatePostSchema), async (req, res) => {
  try {
    const result = await postService.update(Number(req.params.id), req.body);
    const response: ApiResponse<Post> = {
      success: true,
      data: result,
      message: POST_MESSAGES.UPDATED,
    };
    return res.status(HTTP_STATUS.OK).json(response);
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      return res.status(err.statusCode).json(response);
    }
    const response: ApiResponse<null> = {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await postService.delete(Number(req.params.id));
    const response: ApiResponse<Post> = {
      success: true,
      data: result,
      message: POST_MESSAGES.DELETED,
    };
    return res.status(HTTP_STATUS.OK).json(response);
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      return res.status(err.statusCode).json(response);
    }
    const response: ApiResponse<null> = {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

export { router as postRouter };
