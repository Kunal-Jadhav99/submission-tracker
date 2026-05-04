import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  color: { type: String, default: "#8B5CF6" },
  gradient: { type: String, default: "from-violet-500 to-indigo-500" },
  preferences: {
    theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
    notifications: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default models.User || model("User", UserSchema);
