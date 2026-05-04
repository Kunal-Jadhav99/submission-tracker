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

const SubTaskSchema = new Schema({
  description: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  completed: { type: Boolean, default: false },
  completedAt: Date,
});

const TaskSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, default: "General" },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  notes: { type: String, default: "" },
  files: [FileSchema],
  subTasks: [SubTaskSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Task || model("Task", TaskSchema);
