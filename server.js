import express from "express";
import mongoose from "mongoose";
// import Message from "./dbMessages.js";
import Chatroom from "./dbChatroom.js";
import Pusher from "pusher";
import Cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8001;
const pusher0 = new Pusher({
  appId: process.env.APPID0,
  key: process.env.KEY0,
  secret: process.env.SECRET0,
  cluster: process.env.CLUSTER0,
  useTLS: process.env.USETLS0,
});
const pusher1 = new Pusher({
  appId: process.env.APPID1,
  key: process.env.KEY1,
  secret: process.env.SECRET1,
  cluster: process.env.CLUSTER1,
  useTLS: process.env.USETLS1,
});
const connection_url = process.env.CONNECTION_URL;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Header", "*");
  next();
});
app.use(Cors());

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");
  const messageCollection = db.collection("messages");
  const messageChangeStream = messageCollection.watch();
  messageChangeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher0.trigger("messages-channel", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timeStamp: messageDetails.timeStamp,
        received: messageDetails.received,
      });
    } else {
      console.log("error");
    }
  });
  const chatRoomCollection = db.collection("chatrooms");
  const chatRoomChangeStream = chatRoomCollection.watch();
  chatRoomChangeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const chatRoomDetails = change.fullDocument;
      console.log(chatRoomDetails);
      pusher1.trigger("chatrooms-channel", "inserted", {
        _id: chatRoomDetails._id,
        roomName: chatRoomDetails.roomName,
        messages: chatRoomDetails.messages,
      });
    } else {
      console.log("error");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("success"));
// app.get("/messages/sync", (req, res) => {
//   Message.find((err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.status(200).send(data);
//     }
//   });
// });
// app.post("/messages/new", (req, res) => {
//   const newMessage = req.body;
//   Message.create(newMessage, (err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.status(201).send(data);
//     }
//   });
// });
// app.delete("/messages", (req, res) => {
//   Message.deleteMany({})
//     .then((data) => {
//       res.status(204).send(data);
//     })
//     .catch((err) => {
//       res.status(500).send(err);
//     });
// });

app.get("/chatrooms/sync", (req, res) => {
  Chatroom.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});
app.get("/chatrooms/sync/:id", async (req, res) => {
  await Chatroom.findById(req.params.id)
    .then((data) => {
      if (!data) {
        return res.status(404).end();
      } else {
        return res.status(200).send(data);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
app.get("/chatrooms/sync/:id/messages", async (req, res) => {
  await Chatroom.findById(req.params.id)
    .then((data) => {
      if (!data) {
        return res.status(404).end();
      } else {
        res.status(200).send(data.messages);
        return data.messages;
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/chatrooms/sync/:id/messages", async (req, res) => {
  const newMessage = req.body;
  await Chatroom.findById(req.params.id)
    .then((data) => {
      if (!data) {
        return res.status(404).end();
      } else {
        data.messages.push(newMessage);
        return data;
      }
    })
    .then((data) => {
      data.save();
      res.status(200).send(data.messages);
      console.log(data.messages);
      return data.messages;
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/chatrooms/new", (req, res) => {
  const newChatroom = req.body;
  Chatroom.create(newChatroom, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.delete("/chatrooms", (req, res) => {
  Chatroom.deleteMany({})
    .then((data) => {
      res.status(204).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
app.listen(port, () => console.log(`Listening on port ${port}`));
