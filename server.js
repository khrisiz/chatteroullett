const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Create an HTTP server that serves index.html
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Attach WebSocket to the HTTP server
const wss = new WebSocket.Server({ server });

let waitingClient = null;
const pairs = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  if (waitingClient) {
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

// Use Render's port environment variable or fallback to 3001
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});

