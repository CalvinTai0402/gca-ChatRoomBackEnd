import mongoose from "mongoose";

const gcaChatSchema = mongoose.Schema({
  name: String,
  message: String,
  timeStamp: String,
  received: Boolean,
  chatroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chatroom",
  },
});

export default mongoose.model("messages", gcaChatSchema);
