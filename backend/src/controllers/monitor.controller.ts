import { Request, Response, NextFunction } from "express";
import { MonitorService } from "../services/monitor.service";
import { AppError } from "../errors/AppError";

export class MonitorController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, url, interval_minutes, webhook_url, method, expected_status_code } = req.body;
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      if (!name || !url) {
        throw new AppError("Name and URL are required", 400);
      }

      const monitor = await MonitorService.create(userId, name, url, interval_minutes, webhook_url, method, expected_status_code);
      return res.status(201).json({ monitor });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const monitors = await MonitorService.list(userId);
      return res.json({ monitors });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      if (!userId) throw new AppError("Unauthorized", 401);

      const monitor = await MonitorService.getById(userId, id);
      return res.json({ monitor });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      if (!userId) throw new AppError("Unauthorized", 401);

      const monitor = await MonitorService.update(userId, id, req.body);
      return res.json({ monitor });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      if (!userId) throw new AppError("Unauthorized", 401);

      await MonitorService.delete(userId, id);
      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      if (!userId) throw new AppError("Unauthorized", 401);

      // Verify ownership
      await MonitorService.getById(userId, id);

      const stats = await MonitorService.getStats(userId, id);
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
