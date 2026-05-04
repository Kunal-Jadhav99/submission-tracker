import { Schema, model, models } from "mongoose";

const MarkSchema = new Schema({
  exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Mark || model("Mark", MarkSchema);
