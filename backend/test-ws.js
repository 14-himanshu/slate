import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const token = jwt.sign({ id: '665123456789012345678901', username: 'testuser' }, JWT_SECRET, { expiresIn: '1d' });

const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

ws.on('error', console.error);

ws.on('open', () => {
  console.log("Connected");
  ws.send(JSON.stringify({ type: 'joinRoom', payload: { roomId: '1' } }));
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'chat',
      payload: {
        roomId: '1',
        message: 'https://github.com/',
        messageType: 'text',
        linkPreview: {
          title: "Test", description: "Test Desc", image: "https://test.com/img.png", url: "https://github.com"
        }
      }
    }));
  }, 500);
});

ws.on('message', (data) => {
  console.log("Received:", JSON.parse(data.toString()));
});

setTimeout(() => { ws.close(); process.exit(0); }, 2000);
