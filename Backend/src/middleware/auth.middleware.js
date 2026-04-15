import { getAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/express';
import UserModel from "../models/user.model.js";

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY 
});

export const authverify = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized: Please log in first." });
    }

    let user = await UserModel.findOne({ clerkId });

    // Upsert: Create user on first login after verifying token
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
    console.error("Clerk Middleware Error:", error);
    res.status(500).json({ message: "Error syncing user session" });
  }
};
