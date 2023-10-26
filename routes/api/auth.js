import express from "express";

import authController from "../../controllers/auth-controller.js";

import { isEmptyBody, authenticate, upload } from "../../middlewares/index.js";

import { validateBody } from "../../decorators/index.js";

import { userSignupSchema, userLoginSchema, updateSubscriptionSchema, userEmailSchema } from "../../models/User.js";

const userSignupValidate = validateBody(userSignupSchema);

const userSigninValidate = validateBody(userLoginSchema);

const userUpdateFavorite = validateBody(updateSubscriptionSchema);

const userEmailValidate = validateBody(userEmailSchema);

const authRouter = express.Router();

authRouter.post('/register', isEmptyBody, userSignupValidate, authController.register);

authRouter.get("/verify/:verificationToken", authController.verify);

authRouter.post("/verify", userEmailValidate, authController.resendVerifyEmail);

authRouter.post('/login', isEmptyBody, userSigninValidate, authController.login);

authRouter.get('/current', authenticate, authController.getCurrent);

authRouter.post('/logout', authenticate, authController.logout);

authRouter.patch('/', authenticate, userUpdateFavorite, authController.updateSubscription);

authRouter.patch("/avatars", authenticate, upload.single("avatar"), authController.updateAvatarUser);

export default authRouter;