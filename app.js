const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentTurn = null;
let startTime = 0;

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { action, name } = JSON.parse(message);
    console.log(action, name);
    switch (action) {
      case 'requestShower':
        if (currentTurn === null) {
          currentTurn = name;
          startTime = Date.now();
        }
        break;
      case 'releaseShower':
        if (currentTurn === name) {
          currentTurn = null;
          startTime = null;
        }
        break;
    }
    broadcastStatus();
  });
});

function broadcastStatus() {
  const d = new Date(startTime);
  console.log(currentTurn, d.toLocaleTimeString());
  const data = {
    currentTurn: currentTurn,
    startTime: startTime
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Serve static files
app.use(express.static(__dirname));

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
