import { Router } from "express";
import { TeamService } from "../service/teamService.js";
import { validate } from "../middleware/validate.js";
import { createTeamSchema, updateTeamSchema, addTeamAttachmentsSchema } from "../schemas/team.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { HttpError } from "../errors/HttpError.js";
import {
  RoleEnum,
  HTTP_STATUS,
  ERROR_MESSAGES,
  TEAM_ERRORS,
  TEAM_MESSAGES,
} from "@uit-volunteer-map/shared";

const router = Router();
const teamService = new TeamService();

router.get("/", async (req, res) => {
  try {
    const userRole = req.user?.role;
    const data = await teamService.getAll(userRole);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return res
        .status(err.statusCode)
        .json({ success: false, error: err.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: TEAM_ERRORS.INVALID_ID,
      });
    }
    const data = await teamService.getOne(id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return res
        .status(err.statusCode)
        .json({ success: false, error: err.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

router.post(
  "/",
  authenticateToken,
  requireRole([RoleEnum.ADMIN]),
  validate(createTeamSchema),
  async (req, res) => {
    try {
      const data = await teamService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: TEAM_MESSAGES.CREATED,
        data,
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.put(
  "/:id",
  authenticateToken,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]),
  validate(updateTeamSchema),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: TEAM_ERRORS.INVALID_ID,
        });
      }
      
      const data = await teamService.update(id, req.body, req.user!);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: TEAM_MESSAGES.UPDATED,
        data,
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  requireRole([RoleEnum.ADMIN]),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: TEAM_ERRORS.INVALID_ID,
        });
      }
      await teamService.delete(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: TEAM_MESSAGES.DELETED,
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.post(
  "/:id/attachments",
  authenticateToken,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]),
  validate(addTeamAttachmentsSchema),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: TEAM_ERRORS.INVALID_ID,
        });
      }
      const data = await teamService.addAttachments(
        id,
        req.body.attachments,
        req.user!
      );
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Attachments added successfully",
        data,
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.get("/:id/attachments", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: TEAM_ERRORS.INVALID_ID,
      });
    }
    const data = await teamService.getTeamWithAttachments(id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return res
        .status(err.statusCode)
        .json({ success: false, error: err.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

export { router as teamRouter };
