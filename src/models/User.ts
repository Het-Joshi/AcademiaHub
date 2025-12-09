import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ["student", "researcher", "admin"], default: "student" },
  // Domain Relations
  interests: [String],
  followedAuthors: [String],
  savedPapers: [String], // Array of ArXiv IDs
  // Social Relations (User2User)
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Notification Tracking
  lastSeenActivity: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);