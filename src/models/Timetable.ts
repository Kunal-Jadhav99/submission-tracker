import { Schema, model, models } from "mongoose";

// Timetable stores the weekly schedule per user group
// Each day has an array of {subjectId, period, startTime, endTime}
const TimetableSchema = new Schema({
  dayOfWeek: { type: Number, required: true }, // 0=Sunday, 1=Monday...6=Saturday
  period: { type: Number, required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  startTime: { type: String, default: "" }, // "09:00"
  endTime: { type: String, default: "" },   // "10:00"
}, { timestamps: true });

export default models.Timetable || model("Timetable", TimetableSchema);
