import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  paperId: { type: String, required: true }, // The ArXiv ID
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: String, // Cached for display
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);