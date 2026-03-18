import { Router } from "express";
import { getMe, loginUser, registerUser, verifyEmail } from "../controller/user.controller.js";
import {
  loginUserValidator,
  registerUserValidator,
  validateRequest,
} from "../validate/user.validate.js";
import { authverify } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.post("/register", registerUserValidator, validateRequest, registerUser);
userRouter.post("/login", loginUserValidator, validateRequest, loginUser);
userRouter.get("/me",authverify, getMe);
userRouter.get("/verify", verifyEmail);

export default userRouter;
