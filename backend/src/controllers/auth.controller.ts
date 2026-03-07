import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { AuthService } from "../services/auth.service";
import { env } from "../config/env";
import { verifyToken } from "../utils/tokens";
import { AppError } from "../errors/AppError";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const user = await AuthService.register(email, password);
      const { access, refresh } = await AuthService.createAuthSession(user.id);

      AuthController.setCookies(res, access, refresh);

      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate(
      "local",
      { session: false },
      async (err: any, user: any, info: any) => {
        if (err) return next(err);

        if (!user) {
          return next(new AppError(info?.message || "Invalid credentials", 401));
        }

        try {
          const { access, refresh } = await AuthService.createAuthSession(user.id);

          AuthController.setCookies(res, access, refresh);

          return res.status(200).json({
            user: {
              id: user.id,
              email: user.email,
            },
          });
        } catch (error) {
          next(error);
        }
      }
    )(req, res, next);
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshCookie = (req as any).cookies?.refresh_token as string | undefined;
      if (!refreshCookie) {
        throw new AppError("Missing refresh token", 401);
      }

      const decoded = verifyToken<{ userId: string; jti?: string; type?: string }>(
        refreshCookie
      );

      if (decoded.type !== "refresh" || !decoded.jti) {
        throw new AppError("Invalid refresh token", 401);
      }

      const { session, user } = await AuthService.refreshToken(decoded.jti);

      AuthController.setCookies(res, session.access, session.refresh);

      return res.json({
        user: { id: user.id, email: user.email, createdAt: user.created_at },
      });
    } catch (error) {
      next(error);
    }
  }

  static logout(req: Request, res: Response) {
    res.clearCookie("access_token", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.clearCookie("refresh_token", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(204).end();
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError("Email is required", 400);
      }

      await AuthService.forgotPassword(email);

      return res.json({
        message: "If that email is registered, a password reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new AppError("Token and new password are required", 400);
      }

      await AuthService.resetPassword(token, password);

      return res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await AuthService.getUserById(userId);

      return res.json({
        user: { id: user.id, email: user.email, createdAt: user.created_at },
      });
    } catch (error) {
      next(error);
    }
  }

  static googleLogin(req: Request, res: Response, next: NextFunction) {
    if (!env.googleClientId || !env.googleClientSecret) {
      throw new AppError("Google auth not configured", 501);
    }
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate(
      "google",
      { session: false, failureRedirect: `${env.frontendOrigin}/?error=google_failed` },
      async (err: any, user: any) => {
        if (err || !user) {
          return res.redirect(`${env.frontendOrigin}/?error=google_failed`);
        }

        try {
          const { access, refresh } = await AuthService.createAuthSession(user.id);

          AuthController.setCookies(res, access, refresh);

          return res.redirect(`${env.frontendOrigin}/`);
        } catch {
          return res.redirect(`${env.frontendOrigin}/?error=google_failed`);
        }
      }
    )(req, res, next);
  }

  private static setCookies(res: Response, access: string, refresh: string) {
    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
