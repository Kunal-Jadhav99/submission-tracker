import { Schema, model, models } from "mongoose";

const StudySessionSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject" },
  title: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
  notes: { type: String, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.StudySession || model("StudySession", StudySessionSchema);
