import { Schema, model, models } from "mongoose";

const PracticalSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, default: 25 },
  category: { type: String, enum: ["Lab", "Mini Project", "Viva", "Experiment", "Report"], default: "Lab" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Practical || model("Practical", PracticalSchema);
