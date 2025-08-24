const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
  });
});

// Sample API endpoints
router.get("/hello", (req, res) => {
  res.json({
    message: "Hello from the backend!",
    timestamp: new Date().toISOString(),
  });
});

router.post("/data", (req, res) => {
  const { data } = req.body;
  res.json({
    message: "Data received successfully",
    receivedData: data,
    timestamp: new Date().toISOString(),
  });
});

// Add more API routes here
router.get("/users", (req, res) => {
  res.json({
    users: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ],
    timestamp: new Date().toISOString(),
  });
});

// Room management endpoints
router.post("/rooms", (req, res) => {
  const { playerName } = req.body;

  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: "Player name is required" });
  }

  // Generate a random 6-digit room code
  const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

  // In a real app, you'd store this in a database
  // For now, we'll use a simple in-memory store
  if (!global.rooms) global.rooms = {};

  global.rooms[roomCode] = {
    code: roomCode,
    players: [{ id: 1, name: playerName.trim(), isHost: true }],
    createdAt: new Date().toISOString(),
    started: false,
  };

  res.json({
    success: true,
    roomCode: roomCode,
    message: "Room created successfully",
  });
});

router.get("/rooms/:code/validate", (req, res) => {
  const { code } = req.params;

  if (!global.rooms || !global.rooms[code]) {
    return res.json({ valid: false, message: "Room not found" });
  }

  res.json({
    valid: true,
    message: "Room exists",
    playerCount: global.rooms[code].players.length,
  });
});

router.post("/rooms/join", (req, res) => {
  const { roomCode, playerName } = req.body;

  if (!roomCode || !playerName || !playerName.trim()) {
    return res
      .status(400)
      .json({ error: "Room code and player name are required" });
  }

  if (!global.rooms || !global.rooms[roomCode]) {
    return res.status(404).json({ error: "Room not found" });
  }

  const room = global.rooms[roomCode];

  // Check if room is full or already started
  if (room.started) {
    return res.status(400).json({ error: "Game has already started" });
  }

  if (room.players.length >= 8) {
    return res.status(400).json({ error: "Room is full" });
  }

  // Check if player name already exists in the room
  const existingPlayer = room.players.find(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
  );
  if (existingPlayer) {
    return res
      .status(400)
      .json({ error: "Player name already exists in this room" });
  }

  // Add player to room
  const newPlayer = {
    id: room.players.length + 1,
    name: playerName.trim(),
    isHost: false,
  };

  room.players.push(newPlayer);

  res.json({
    success: true,
    message: "Joined room successfully",
    players: room.players,
  });
});

module.exports = router;
