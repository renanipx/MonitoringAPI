import { Request, Response, NextFunction } from "express";
import { MonitorService } from "../services/monitor.service";

export class PublicController {
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const statusData = await MonitorService.getByStatusToken(token);
      return res.json(statusData);
    } catch (error) {
      next(error);
    }
  }
}
