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
      const email = clerkUser.emailAddresses[0]?.emailAddress || "unknown@clerk.dev";
      const username = clerkUser.username || clerkUser.firstName || "User";

      // Check if user exists from the old auth system without a clerkId
      let existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        // Link the new Clerk account to the existing MongoDB user
        existingUser.clerkId = clerkId;
        await existingUser.save();
        user = existingUser;
      } else {
        // Entirely new user
        user = await UserModel.create({
          clerkId: clerkId,
          email: email,
          username: username,
        });
      }
    }
    
    req.user = user; // keep backwards compatibility for req.user
    next();
  } catch (error) {
    console.error("Clerk Middleware Error:", error);
    res.status(500).json({ message: "Error syncing user session" });
  }
};
