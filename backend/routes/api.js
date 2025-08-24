const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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
  console.log("🚀 POST /rooms called with body:", req.body);

  const { playerName } = req.body;

  if (!playerName || !playerName.trim()) {
    console.log("❌ Missing player name");
    return res.status(400).json({ error: "Player name is required" });
  }

  try {
    // Generate a random 6-digit room code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🎲 Generated room code:", roomCode);

    // Create room in database
    const roomResult = await pool.query(
      "INSERT INTO rooms (code) VALUES ($1) RETURNING id, code",
      [roomCode]
    );

    const roomId = roomResult.rows[0].id;
    console.log("✅ Room created with ID:", roomId);

    // Add first player as host
    await pool.query(
      "INSERT INTO players (room_id, name, is_host) VALUES ($1, $2, $3)",
      [roomId, playerName.trim(), true]
    );

    console.log("✅ Player added as host:", playerName);

    res.json({
      success: true,
      roomCode: roomCode,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating room:", error);
    res
      .status(500)
      .json({ error: "Failed to create room", details: error.message });
  }
});

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.post("/rooms/join", async (req, res) => {
  console.log("🚀 POST /rooms/join called with body:", req.body);

  const { roomCode, playerName } = req.body;

  if (!roomCode || !playerName || !playerName.trim()) {
    console.log("❌ Missing room code or player name");
    return res
      .status(400)
      .json({ error: "Room code and player name are required" });
  }

  try {
    console.log("🔍 Looking for room with code:", roomCode);

    // Get room details
    const roomResult = await pool.query("SELECT * FROM rooms WHERE code = $1", [
      roomCode,
    ]);

    if (roomResult.rows.length === 0) {
      console.log("❌ Room not found:", roomCode);
      return res.status(404).json({ error: "Room not found" });
    }

    const room = roomResult.rows[0];
    console.log("✅ Room found:", room.id);

    // Check if room is full or already started
    if (room.started) {
      console.log("❌ Game already started in room:", roomCode);
      return res.status(400).json({ error: "Game has already started" });
    }

    // Count current players
    const playerCountResult = await pool.query(
      "SELECT COUNT(*) FROM players WHERE room_id = $1",
      [room.id]
    );

    if (parseInt(playerCountResult.rows[0].count) >= 8) {
      console.log("❌ Room is full:", roomCode);
      return res.status(400).json({ error: "Room is full" });
    }

    // Check if player name already exists in the room
    const existingPlayerResult = await pool.query(
      "SELECT id FROM players WHERE room_id = $1 AND LOWER(name) = LOWER($2)",
      [room.id, playerName.trim()]
    );

    if (existingPlayerResult.rows.length > 0) {
      console.log("❌ Player name already exists:", playerName);
      return res
        .status(400)
        .json({ error: "Player name already exists in this room" });
    }

    // Add player to room
    await pool.query(
      "INSERT INTO players (room_id, name, is_host) VALUES ($1, $2, $3)",
      [room.id, playerName.trim(), false]
    );

    console.log("✅ Player added to room:", playerName);

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
    console.error("❌ Error joining room:", error);
    res
      .status(500)
      .json({ error: "Failed to join room", details: error.message });
  }
});

// Parameterized routes come AFTER specific routes
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

// Leave room endpoint
router.post("/rooms/leave", async (req, res) => {
  const { roomCode, playerName } = req.body;

  if (!roomCode || !playerName) {
    return res
      .status(400)
      .json({ error: "Room code and player name are required" });
  }

  try {
    console.log("🚪 Player leaving room:", { roomCode, playerName });

    // Get room details
    const roomResult = await pool.query("SELECT * FROM rooms WHERE code = $1", [
      roomCode,
    ]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    const room = roomResult.rows[0];

    // Remove player from room
    const deleteResult = await pool.query(
      "DELETE FROM players WHERE room_id = $1 AND name = $2",
      [room.id, playerName]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Player not found in room" });
    }

    console.log("✅ Player removed from room:", playerName);

    // Check if room is now empty and delete it
    const remainingPlayers = await pool.query(
      "SELECT COUNT(*) FROM players WHERE room_id = $1",
      [room.id]
    );

    if (parseInt(remainingPlayers.rows[0].count) === 0) {
      await pool.query("DELETE FROM rooms WHERE id = $1", [room.id]);
      console.log("🗑️ Room deleted (no players left):", roomCode);
    }

    res.json({
      success: true,
      message: "Left room successfully",
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ error: "Failed to leave room" });
  }
});

module.exports = router;
