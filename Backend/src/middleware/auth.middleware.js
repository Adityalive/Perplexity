import { requireAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/express';
import UserModel from "../models/user.model.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const authverify = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth.userId;
      let user = await UserModel.findOne({ clerkId });

      // Upsert: Create user on first login
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        user = await UserModel.create({
          clerkId: clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@clerk.dev",
          username: clerkUser.username || clerkUser.firstName || "User",
        });
      }
      
      req.user = user; // keep backwards compatibility for req.user
      next();
    } catch (error) {
      console.error("Clerk Upsert Error:", error);
      res.status(500).json({ message: "Error syncing user session" });
    }
  }
];
