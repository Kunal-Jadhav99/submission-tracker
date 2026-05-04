import { Schema, model, models } from "mongoose";

const RevisionTopicSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  topicName: { type: String, required: true },
  status: {
    type: String,
    enum: ["Not Started", "Studying", "Needs Revision", "Mastered"],
    default: "Not Started",
  },
  revisionRounds: { type: Number, default: 0 },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.RevisionTopic || model("RevisionTopic", RevisionTopicSchema);
