import { Schema, model, models } from "mongoose";

const FileSchema = new Schema({
  name: String,
  url: String,
  size: Number,
  type: String,
  version: { type: Number, default: 1 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

const AssignmentSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  dueDate: { type: Date, required: true },
  category: {
    type: String,
    enum: ["Lab", "Theory", "Project", "Presentation", "Quiz", "Admin"],
    default: "Theory",
  },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  files: [FileSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Assignment || model("Assignment", AssignmentSchema);
