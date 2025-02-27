import { HttpError, sendEmail } from '../helpers/index.js';
import { ctrlWrapper } from '../decorators/index.js';
import User from '../models/User.js';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import gravatar from "gravatar";

import fs from "fs/promises";

import path from "path";

const avatarsPath = path.resolve("public", "avatars");

import Jimp from 'jimp';
import { nanoid } from 'nanoid';

const { JWT_SECRET, BASE_URL } = process.env;

const register = async(req, res, next) => {
    const {password, email} = req.body
    req.body.password = await bcrypt.hash(password, 10);
    req.body.avatarURL = gravatar.url(email, { protocol: 'https', d: "mp" });
    req.body.verificationToken = nanoid();

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${req.body.verificationToken}">Click to verify email</a>`
    }
    await sendEmail(verifyEmail);
    const {  subscription, avatarURL } = await User.create(req.body);
    res.status(201).json({
      user: {
      email,
      subscription,
      avatarURL
     }
    })
}

const verify = async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
        throw HttpError(404, "User not found")
    }

    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "null" });

    res.status(200).json({
        message: "Verification successful"
    })
}

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw HttpError(404, "Email not found")
    }

    if (user.verify) {
        throw HttpError(400, "Verification has already been passed")
    }

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click to verify email</a>`
    }

    await sendEmail(verifyEmail);

    res.status(200).json({
        message: "Verification email sent"
    })
}

const login = async(req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
       throw HttpError(401,"Email or password is wrong")
    }

    if (!user.verify) {
        throw HttpError(401, "Email not verify")
    }

    const passwordCompare = await bcrypt.compare(password, user.password)
    if (!passwordCompare) {
       throw HttpError(401,"Email or password is wrong")
    }
    
    const { subscription } = user
    
    const payload = {
        id: user._id,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token });
    
    res.status(200).json({
        token,
        user: {
            email,
            subscription
        }
    })
}

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });

  res.status(204).json({
    message: 'Logout success',
  });
};

const getCurrent = async (req, res) => {
  const { subscription, email } = req.user;

  res.json({
    email,
    subscription,
  });
};

const updateSubscription = async (req, res) => {
  const { _id } = req.user;

  const result = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  });

  if (!result) {
    throw HttpError(404, `Not found`);
  }

  res.json({ result });
};

const updateAvatarUser = async (req, res) => {
    const { _id } = req.user;
    const { path: tmpPath, filename } = req.file;
    const newPath = path.join(avatarsPath, filename);
    const file = await Jimp.read(tmpPath);
    await file.resize(250, 250).write(newPath);
    await fs.unlink(tmpPath);
    const avatarURL = path.join("avatars", filename);
    const user = await User.findByIdAndUpdate(_id, { avatarURL });
    if (!user) throw HttpError(404, "Not found");
    res.status(200).json({
        avatarURL
    })
}

export default {
  register: ctrlWrapper(register),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatarUser: ctrlWrapper(updateAvatarUser),
}