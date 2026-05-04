import { Schema, model, models } from "mongoose";

const SubmissionSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  penaltyNote: { type: String, default: "" },
}, { timestamps: true });

export default models.Submission || model("Submission", SubmissionSchema);
