import UserModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.service.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await UserModel.create({ username, email, password });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      return res.status(201).json({
        message: "User registered successfully, but email verification is unavailable",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          verified: newUser.verified,
        },
      });
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
    });
    const verificationUrl = `http://localhost:3000/api/users/verify?token=${token}`;
    const emailText = `Hello ${username},

Thank you for registering at Perplexity. Please verify your email using the link below:
${verificationUrl}

Best regards,
The Perplexity Team`;
    const emailHtml = `
      <p>Hello ${username},</p>
      <p>Thank you for registering at Perplexity.</p>
      <p>
        Please verify your email by clicking
        <a href="${verificationUrl}">this link</a>.
      </p>
      <p>Best regards,<br>The Perplexity Team</p>
    `;

    try {
      await sendEmail(email, "Verify your email", emailText, emailHtml);
    } catch (mailError) {
      console.error("Welcome email failed to send:", mailError.message);
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        verified: newUser.verified,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};


export const getMe = async(req,res)=>{
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    let user = null;

    if (userId) {
      user = await UserModel.findById(userId).select("-password");
    } else if (userEmail) {
      user = await UserModel.findOne({ email: userEmail }).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
}
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const user = await UserModel.findOne({ email: decodedToken.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.verified = true;
    await user.save();

    const html = `
        <h1>Email Verified Successfully!</h1>
        <p>Your email has been verified. You can now log in to your account.</p>
        <a href="http://localhost:3000/login">Go to Login</a>
    `;

    return res.status(200).send(html);
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
