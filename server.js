const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const PEERS_FILE = path.join(__dirname, 'peers.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Peer Endpoints ---
app.post('/api/peer/keepalive', (req, res) => {
  const { sessionId, username } = req.body;
  if (!sessionId || !username) return res.status(400).json({ error: 'Missing sessionId or username' });
  const now = Date.now();
  let peers = readJson(PEERS_FILE, []);
  let peer = peers.find(p => p.sessionId === sessionId);
  if (peer) {
    peer.username = username;
    peer.lastSeen = now;
  } else {
    peers.push({ sessionId, username, lastSeen: now });
  }
  writeJson(PEERS_FILE, peers);
  res.json({ ok: true });
});

app.get('/api/peers', (req, res) => {
  const peers = readJson(PEERS_FILE, []);
  const cutoff = Date.now() - 3 * 60 * 1000;
  const activePeers = peers.filter(p => p.lastSeen > cutoff);
  res.json(activePeers);
});

// --- Message Endpoints ---
app.post('/api/message', (req, res) => {
  const { sender, recipient, time, text } = req.body;
  if (!sender || !recipient || !time || !text) return res.status(400).json({ error: 'Missing fields' });
  let messages = readJson(MESSAGES_FILE, []);
  messages.push({ sender, recipient, time, text });
  writeJson(MESSAGES_FILE, messages);
  res.json({ ok: true });
});

app.get('/api/messages', (req, res) => {
  const { recipient = 'broadcast', limit = 5, before } = req.query;
  let messages = readJson(MESSAGES_FILE, []);
  messages = messages.filter(m => m.recipient === recipient);
  messages.sort((a, b) => new Date(b.time) - new Date(a.time));
  if (before) {
    messages = messages.filter(m => new Date(m.time) < new Date(before));
  }
  res.json(messages.slice(0, Number(limit)).reverse());
});

app.listen(PORT, () => {
  console.log(`RinkOS backend running on http://localhost:${PORT}`);
}); 