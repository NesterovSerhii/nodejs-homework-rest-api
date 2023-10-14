import express from "express";

import authController from "../../controllers/auth-controller.js";

import { isEmptyBody, authenticate } from "../../middlewares/index.js";

import { validateBody } from "../../decorators/index.js";

import { userSignupSchema, userLoginSchema } from "../../models/User.js";

const userSignupValidate = validateBody(userSignupSchema)
const userSigninValidate = validateBody(userLoginSchema)

const authRouter = express.Router();

authRouter.post('/register', isEmptyBody, userSignupValidate, authController.register);

authRouter.post('/login', isEmptyBody, userSigninValidate, authController.login);

authRouter.get('/current', authenticate, authController.getCurrent);

authRouter.post('/logout', authenticate, authController.logout);

authRouter.patch('/users', authenticate, userSigninValidate, authController.updateSubscription);

export default authRouter;