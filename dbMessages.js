import mongoose from "mongoose";

const gcaChatSchema = mongoose.Schema({
  name: String,
  message: String,
  timeStamp: String,
  received: Boolean,
});

export default mongoose.model("messages", gcaChatSchema);
