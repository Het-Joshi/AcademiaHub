import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
  paperId: { type: String, required: true }, // The ArXiv ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Prevent a user from liking the same paper twice
LikeSchema.index({ paperId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model("Like", LikeSchema);