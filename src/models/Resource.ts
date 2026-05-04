import { Schema, model, models } from "mongoose";

const ResourceSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["pdf", "image", "link", "note"], required: true },
  url: { type: String, default: "" },
  content: { type: String, default: "" },
  tags: [{ type: String }],
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  starredBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Resource || model("Resource", ResourceSchema);
