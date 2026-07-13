import { Schema, model, models } from "mongoose";

const ReactionSchema = new Schema({
  emoji: String,
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const ActivityLogSchema = new Schema({
  action: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  itemId: { type: Schema.Types.ObjectId },
  itemType: { type: String, default: "" },
  details: { type: String, default: "" },
  reactions: [ReactionSchema],
  // Extra structured metadata (e.g. for task completions: forUserId, forUserName, isSelf)
  meta: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

export default models.ActivityLog || model("ActivityLog", ActivityLogSchema);
