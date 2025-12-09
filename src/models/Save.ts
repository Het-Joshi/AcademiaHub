import mongoose from "mongoose";

const SaveSchema = new mongoose.Schema({
  paperId: { type: String, required: true }, // The ArXiv ID
  paperTitle: { type: String }, // Cached for display
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Prevent duplicate saves
SaveSchema.index({ paperId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Save || mongoose.model("Save", SaveSchema);