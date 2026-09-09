import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import { signToken } from "../utils/jwt.js";

const buildAuthPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ErrorResponse("Name, email, and password are required", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ErrorResponse("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role === "admin" ? "admin" : "member",
  });

  res.status(201).json({
    token: signToken({ id: user._id }),
    user: buildAuthPayload(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ErrorResponse("Email and password are required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  res.json({
    token: signToken({ id: user._id }),
    user: buildAuthPayload(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
