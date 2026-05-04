import { Schema, model, models } from "mongoose";

const ExamSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  totalMarks: { type: Number, required: true, default: 100 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Exam || model("Exam", ExamSchema);
