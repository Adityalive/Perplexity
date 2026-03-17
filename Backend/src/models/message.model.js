import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "ai"],
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
