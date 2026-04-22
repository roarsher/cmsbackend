const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient:   { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ["student","teacher","admin"], required: true },
    type: {
      type: String,
      enum: ["attendance","notice","result","class","fee","live_session","general"],
      default: "general",
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: "" },   // frontend route to navigate to
    read:    { type: Boolean, default: false },
    icon:    { type: String, default: "🔔" },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);