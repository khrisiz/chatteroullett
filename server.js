const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (index.html, CSS, JS, etc.) from project root
app.use(express.static(path.join(__dirname)));

let waitingClient = null;
const pairs = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  if (waitingClient) {
    // Pair clients
    pairs.set(ws, waitingClient);
    pairs.set(waitingClient, ws);

    ws.send('✅ Connected to a partner!');
    waitingClient.send('✅ Connected to a partner!');

    waitingClient = null;
  } else {
    waitingClient = ws;
    ws.send('⏳ Waiting for a partner...');
  }

  ws.on('message', (message) => {
    const partner = pairs.get(ws);
    if (partner && partner.readyState === WebSocket.OPEN) {
      partner.send(message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const partner = pairs.get(ws);
    if (partner && partner.readyState === WebSocket.OPEN) {
      partner.send('❌ Your partner has disconnected.');
      pairs.delete(partner);
    }
    pairs.delete(ws);
    if (waitingClient === ws) waitingClient = null;
  });
});

// Use the port provided by the environment or default to 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
