import { Schema, model, models } from "mongoose";

const PracticalSubmissionSchema = new Schema({
  practical: { type: Schema.Types.ObjectId, ref: "Practical", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  marksObtained: { type: Number, default: null },
  isLate: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.PracticalSubmission || model("PracticalSubmission", PracticalSubmissionSchema);
