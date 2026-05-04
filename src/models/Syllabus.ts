import { Schema, model, models } from "mongoose";

const TopicSchema = new Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: Schema.Types.ObjectId, ref: "User" },
  completedAt: Date,
});

const SyllabusSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, unique: true },
  topics: [TopicSchema],
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Syllabus || model("Syllabus", SyllabusSchema);
