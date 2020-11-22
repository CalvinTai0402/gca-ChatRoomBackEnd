import express from "express";
import mongoose from "mongoose";
import Message from "./dbMessages.js";
import Pusher from "pusher";
import Cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8001;
const pusher = new Pusher({
  appId: process.env.APPID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  useTLS: process.env.USETLS,
});
const connection_url = process.env.CONNECTION_URL;

app.use(express.json());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Header", "*");
//   next();
// });
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
  const changeStream = messageCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages-channel", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timeStamp: messageDetails.timeStamp,
        received: messageDetails.received,
      });
    } else {
      console.log("error");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("success"));
app.get("/messages/sync", (req, res) => {
  Message.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});
app.post("/messages/new", (req, res) => {
  const newMessage = req.body;
  Message.create(newMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
app.delete("/messages", (req, res) => {
  Message.deleteMany((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(204).send(data);
    }
  });
});
app.listen(port, () => console.log(`Listening on port ${port}`));
