const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let buttonStatus = false;
let startTime = null;
let currentTurn = null;

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { action, name } = JSON.parse(message);

    if (action === 'toggleButton') {
      if (currentTurn === name) {
        toggleButton();
      }
    } else if (action === 'requestTurn') {
      requestTurn(name, ws);
    }
  });
});

function toggleButton() {
  buttonStatus = !buttonStatus;

  if (buttonStatus && !startTime) {
    startTime = Date.now();
  } else if (!buttonStatus) {
    startTime = null;
  }

  broadcastStatus();
}

function requestTurn(name, ws) {
  if (currentTurn === null) {
    currentTurn = name;
    ws.send(JSON.stringify({ status: 'success', turn: true }));
    broadcastStatus();
  } else {
    ws.send(JSON.stringify({ status: 'success', turn: false }));
  }
}

function broadcastStatus() {
  const elapsedTime = buttonStatus ? Date.now() - startTime : 0;
  const seconds = Math.floor(elapsedTime / 1000);

  const data = {
    buttonStatus,
    elapsedTime: seconds,
    currentTurn: currentTurn || "No one's turn",
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.use(express.json());

app.get('/', (req, res) => {

  name1 = req.query.name || null;
  
  console.log(req.query.name);

  if (!name1) {
    return res.status(400).json({ error: 'Please provide a name.' });
  }
  
  res.sendFile(__dirname + '/index.html');
});

// Serve static files
app.use(express.static(__dirname));

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
