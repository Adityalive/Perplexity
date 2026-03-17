import { Router } from "express";
import { getMe, loginUser, registerUser } from "../controller/user.controller.js";
import {
  loginUserValidator,
  registerUserValidator,
  validateRequest,
} from "../validate/user.validate.js";

const userRouter = Router();

userRouter.post("/register", registerUserValidator, validateRequest, registerUser);
userRouter.post("/login", loginUserValidator, validateRequest, loginUser);
userRouter.get("/me", getMe);

export default userRouter;
