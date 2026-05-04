import { Schema, model, models } from "mongoose";

const ReplySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ["assignment", "task"], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  replies: [ReplySchema],
}, { timestamps: true });

export default models.Comment || model("Comment", CommentSchema);
