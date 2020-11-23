import mongoose from "mongoose";

const gcaChatroomchema = mongoose.Schema({
  id: String,
  roomName: String,
  messages: [],
});

export default mongoose.model("chatroom", gcaChatroomchema);
