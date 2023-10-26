import HttpError from '../helpers/HttpError.js';
import { ctrlWrapper } from '../decorators/index.js';
import User from '../models/User.js';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import gravatar from "gravatar";

import fs from "fs/promises";

import path from "path";

const avatarsPath = path.resolve("public", "avatars");

import Jimp from 'jimp';

const { JWT_SECRET } = process.env;


const register = async (req, res) => {
  const { email, password, subscription } = req.body;

  const user = await User.findOne({ email });
  
const timestamp = Date.now();
const url = gravatar.url(`${email}?t=${timestamp}`, {s: '200', r: 'pg', d: '404'});

  if (user) {
   return res.status(409).json({
      message: 'Email in use',
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await User.create({
    ...req.body,
    password: hashPassword,
    subscription,
    avatarURL: url,
  });

  res.status(201).json({
    "user": {
    email: result.email,
    subscription: result.subscription}  
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      throw HttpError(401, "Email or password is wrong")
    }

    const passwordCompare = await bcrypt.compare(password, user.password)
    if (!passwordCompare) {
      throw HttpError(401, "Email or password is wrong")
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
    catch (error){
if (error.status === 401) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
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
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatarUser: ctrlWrapper(updateAvatarUser),
}