import { Activity } from "../models/Activity.js";
import { ensureProjectMember } from "../services/projectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActivities = asyncHandler(async (req, res) => {
  await ensureProjectMember(req.params.projectId, req.user._id);
  const activities = await Activity.find({ project: req.params.projectId })
    .populate("user", "name email avatar")
    .sort({ createdAt: -1 })
    .limit(25);

  res.json({ activities });
});
