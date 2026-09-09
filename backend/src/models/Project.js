import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { _id: false }
);

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned",
    },
    completedAt: Date,
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    sprints: {
      type: [sprintSchema],
      default: [],
    },
    color: {
      type: String,
      default: "#1d4ed8",
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
