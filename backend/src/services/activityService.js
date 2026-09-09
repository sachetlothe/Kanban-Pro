import { Activity } from "../models/Activity.js";

export const logActivity = async ({ project, user, action, meta = {} }) => {
  return Activity.create({ project, user, action, meta });
};
