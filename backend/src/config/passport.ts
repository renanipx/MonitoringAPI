import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import { pool } from "./database";
import { env } from "./env";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    async (email, password, done) => {
      try {
        const emailNorm = email.trim().toLowerCase();
        const result = await pool.query(
          "SELECT id, email, password_hash FROM users WHERE lower(email) = $1",
          [emailNorm]
        );

        let userRow = result.rows[0] as
          | { id: string; email: string; password_hash: string }
          | undefined;

        if (!userRow) {
          const passwordHash = await bcrypt.hash(password, 10);
          const insertResult = await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash",
            [emailNorm, passwordHash]
          );
          userRow = insertResult.rows[0] as {
            id: string;
            email: string;
            password_hash: string;
          };
        } else {
          const validPassword = await bcrypt.compare(
            password,
            userRow.password_hash
          );

          if (!validPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }
        }

        return done(null, { id: userRow.id, email: userRow.email });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.backendUrl}/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          const emailNorm = email.trim().toLowerCase();
          const result = await pool.query(
            "SELECT id, email FROM users WHERE lower(email) = $1",
            [emailNorm]
          );

          let userRow = result.rows[0] as { id: string; email: string } | undefined;

          if (!userRow) {
            const insertResult = await pool.query(
              "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
              [emailNorm, "GOOGLE_AUTH"] // Placeholder password for social logins
            );
            userRow = insertResult.rows[0] as { id: string; email: string };
          }

          return done(null, { id: userRow.id, email: userRow.email });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
