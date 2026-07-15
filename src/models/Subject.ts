import { Schema, model, models } from "mongoose";

const SubjectSchema = new Schema({
  name: { type: String, required: true },
  color: { type: Number, default: 0 },
  creditHours: { type: Number, default: 3 },
  professor: { type: String, default: "" },
  archived: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Subject || model("Subject", SubjectSchema);
