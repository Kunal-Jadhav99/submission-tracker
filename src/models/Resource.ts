import { Schema, model, models } from "mongoose";

const ResourceSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["pdf", "image", "video", "note", "link", "other"], required: true },
  // For link-type resources
  url: { type: String, default: "" },
  // For file uploads stored directly in DB (base64-encoded)
  fileData: { type: String, default: "" },   // base64 string
  fileName: { type: String, default: "" },   // original filename
  fileMime: { type: String, default: "" },   // mime type e.g. "application/pdf"
  fileSize: { type: Number, default: 0 },    // bytes
  content: { type: String, default: "" },
  tags: [{ type: String }],
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  starredBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Resource || model("Resource", ResourceSchema);
