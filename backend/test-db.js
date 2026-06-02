import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Message } from './src/models/Message.js';
import { saveMessage, getRoomHistory } from './src/services/message.service.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  
  const saved = await saveMessage(
    "1",
    new mongoose.Types.ObjectId(),
    "testuser",
    "https://github.com",
    "text",
    undefined,
    undefined,
    undefined,
    { title: "Test", description: "Desc", image: "Img", url: "Url" }
  );
  
  console.log("Saved:", saved);
  
  const history = await getRoomHistory("1", undefined, 1);
  console.log("History:", history[0]);
  
  await mongoose.disconnect();
}
main().catch(console.error);
