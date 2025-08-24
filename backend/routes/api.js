const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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
router.post("/rooms", async (req, res) => {
  const { playerName } = req.body;

  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: "Player name is required" });
  }

  try {
    // Generate a random 6-digit room code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create room in database
    const roomResult = await pool.query(
      "INSERT INTO rooms (code) VALUES ($1) RETURNING id, code",
      [roomCode]
    );

    const roomId = roomResult.rows[0].id;

    // Add first player as host
    await pool.query(
      "INSERT INTO players (room_id, name, is_host) VALUES ($1, $2, $3)",
      [roomId, playerName.trim(), true]
    );

    res.json({
      success: true,
      roomCode: roomCode,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

router.get("/rooms/:code/validate", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT r.*, COUNT(p.id) as player_count FROM rooms r LEFT JOIN players p ON r.id = p.room_id WHERE r.code = $1 GROUP BY r.id",
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, message: "Room not found" });
    }

    const room = result.rows[0];
    res.json({
      valid: true,
      message: "Room exists",
      playerCount: parseInt(room.player_count),
    });
  } catch (error) {
    console.error("Error validating room:", error);
    res.status(500).json({ error: "Failed to validate room" });
  }
});

router.post("/rooms/join", async (req, res) => {
  const { roomCode, playerName } = req.body;

  if (!roomCode || !playerName || !playerName.trim()) {
    return res
      .status(400)
      .json({ error: "Room code and player name are required" });
  }

  try {
    // Get room details
    const roomResult = await pool.query(
      "SELECT * FROM rooms WHERE code = $1",
      [roomCode]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    const room = roomResult.rows[0];

    // Check if room is full or already started
    if (room.started) {
      return res.status(400).json({ error: "Game has already started" });
    }

    // Count current players
    const playerCountResult = await pool.query(
      "SELECT COUNT(*) FROM players WHERE room_id = $1",
      [room.id]
    );

    if (parseInt(playerCountResult.rows[0].count) >= 8) {
      return res.status(400).json({ error: "Room is full" });
    }

    // Check if player name already exists in the room
    const existingPlayerResult = await pool.query(
      "SELECT id FROM players WHERE room_id = $1 AND LOWER(name) = LOWER($2)",
      [room.id, playerName.trim()]
    );

    if (existingPlayerResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Player name already exists in this room" });
    }

    // Add player to room
    await pool.query(
      "INSERT INTO players (room_id, name, is_host) VALUES ($1, $2, $3)",
      [room.id, playerName.trim(), false]
    );

    // Get all players in the room
    const playersResult = await pool.query(
      "SELECT id, name, is_host FROM players WHERE room_id = $1 ORDER BY joined_at",
      [room.id]
    );

    res.json({
      success: true,
      message: "Joined room successfully",
      players: playersResult.rows,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Get players in a room
router.get("/rooms/:code/players", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT p.id, p.name, p.is_host FROM players p JOIN rooms r ON p.room_id = r.id WHERE r.code = $1 ORDER BY p.joined_at",
      [code]
    );

    res.json({
      success: true,
      players: result.rows,
    });
  } catch (error) {
    console.error("Error getting players:", error);
    res.status(500).json({ error: "Failed to get players" });
  }
});

module.exports = router;
