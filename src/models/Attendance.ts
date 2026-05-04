import { Schema, model, models } from "mongoose";

const AttendanceSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent"], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default models.Attendance || model("Attendance", AttendanceSchema);
