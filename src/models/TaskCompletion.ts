import { Schema, model, models } from "mongoose";

const TaskCompletionSchema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.TaskCompletion || model("TaskCompletion", TaskCompletionSchema);
