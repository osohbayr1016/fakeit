"use client";

import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";

interface Player {
  id: number;
  name: string;
  isHost: boolean;
}

interface GameResult {
  impostor: string;
  caught: boolean;
  votes: Record<string, number>;
}

interface ApiPlayer {
  id: number;
  name: string;
  is_host: boolean;
}

interface PlayersResponse {
  success: boolean;
  players: ApiPlayer[];
}

// Mongolian words for the game
const MONGOLIAN_WORDS = {
  animals: ["Чоно", "Бар", "Тэмээ", "Адуу", "Хонь", "Үхэр", "Буга", "Арслан"],
  foods: [
    "Бууз",
    "Хуушуур",
    "Гурилтай шөл",
    "Цуйван",
    "Тараг",
    "Ааруул",
    "Айраг",
    "Өрөм",
  ],
  places: [
    "Улаанбаатар",
    "Говь",
    "Хөвсгөл",
    "Эрдэнэт",
    "Дархан",
    "Орхон",
    "Сэлэнгэ",
    "Өмнөговь",
  ],
  objects: [
    "Утас",
    "Компьютер",
    "Ном",
    "Цүнх",
    "Гутал",
    "Цаг",
    "Оочир",
    "Түлхүүр",
  ],
};

// Function to get a random word from any category
const getRandomWord = () => {
  const categories = Object.values(MONGOLIAN_WORDS);
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  return randomCategory[Math.floor(Math.random() * randomCategory.length)];
};

// Function to get the category of a word
const getWordCategory = (word: string) => {
  for (const [category, words] of Object.entries(MONGOLIAN_WORDS)) {
    if (words.includes(word)) {
      return category;
    }
  }
  return null;
};

export default function Home() {
  const [gamePhase, setGamePhase] = useState<
    "lobby" | "waiting" | "game" | "clue" | "voting" | "results"
  >("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [isImpostor, setIsImpostor] = useState(false);
  const [timer, setTimer] = useState(10);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [gameMode, setGameMode] = useState<"1-imposter" | "2-imposter">(
    "1-imposter"
  );
  const [playerPollingInterval, setPlayerPollingInterval] =
    useState<NodeJS.Timeout | null>(null);

  const { loading, error, executeApiCall, clearError } = useApi();

  // Function to poll for player updates
  const startPlayerPolling = (roomCode: string) => {
    const interval = setInterval(async () => {
      try {
        const result = (await apiService.getRoomPlayers(
          roomCode
        )) as unknown as PlayersResponse;
        if (result && result.players) {
          setPlayers(
            result.players.map((p: ApiPlayer) => ({
              id: p.id,
              name: p.name,
              isHost: p.is_host,
            }))
          );

          // Update host status
          const currentPlayer = result.players.find(
            (p: ApiPlayer) => p.name === playerName
          );
          setIsHost(currentPlayer?.is_host || false);
        }
      } catch (err) {
        console.error("Failed to update players:", err);
      }
    }, 2000); // Poll every 2 seconds

    setPlayerPollingInterval(interval);
  };

  const stopPlayerPolling = useCallback(() => {
    if (playerPollingInterval) {
      clearInterval(playerPollingInterval);
      setPlayerPollingInterval(null);
    }
  }, [playerPollingInterval]);

  // No auto-simulation - start in lobby
  useEffect(() => {
    // Initialize empty state
    setGamePhase("lobby");
    setPlayers([]);
    setIsHost(false);

    // Cleanup polling on unmount
    return () => {
      stopPlayerPolling();
    };
  }, [stopPlayerPolling]);

  // Handle page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomCode && playerName) {
        // Try to notify server that player is leaving
        // This is a best-effort approach since we can't guarantee it will execute
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${
              process.env.NEXT_PUBLIC_API_URL ||
              "https://fakeit-k1hq.onrender.com/api"
            }/rooms/leave`,
            JSON.stringify({ roomCode, playerName })
          );
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomCode, playerName]);

  const createGame = async () => {
    if (!playerName.trim()) return;

    try {
      const result = await executeApiCall(apiService.createRoom, playerName);
      console.log("Game created:", result);
      if (result.roomCode) {
        setRoomCode(result.roomCode);
        setPlayers([{ id: 1, name: playerName, isHost: true }]);
        setIsHost(true);
        setGamePhase("waiting");
        startPlayerPolling(result.roomCode);
      }
    } catch (err) {
      console.error("Failed to create game:", err);
    }
  };

  const joinGame = async () => {
    if (!roomCode || !playerName.trim()) return;

    try {
      // First validate the room code
      const validationResult = await executeApiCall(
        apiService.validateRoom,
        roomCode
      );

      if (validationResult.valid) {
        // Room exists, join it
        const result = await executeApiCall(
          apiService.joinRoom,
          roomCode,
          playerName
        );
        console.log("Joined game:", result);

        if (result.success) {
          setPlayers(result.players || []);
          setIsHost(false);
          setGamePhase("waiting");
          startPlayerPolling(roomCode);
        }
      } else {
        // Room doesn't exist - show specific error
        throw new Error("This code is invalid. Please check and try again.");
      }
    } catch (err) {
      console.error("Failed to join game:", err);
      // Error will be set by the useApi hook
    }
  };

  const startGame = () => {
    setGamePhase("game");

    // Calculate number of imposters based on game mode and player count
    let numImposters = 1;
    if (gameMode === "2-imposter" && players.length >= 5) {
      numImposters = 2;
    }

    // Select random imposters
    const allPlayerNames = players.map((p) => p.name);
    const selectedImposters: string[] = [];

    for (let i = 0; i < numImposters; i++) {
      const availablePlayers = allPlayerNames.filter(
        (name) => !selectedImposters.includes(name)
      );
      if (availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        selectedImposters.push(availablePlayers[randomIndex]);
      }
    }

    // Check if current player is imposter
    const isCurrentPlayerImposter = selectedImposters.includes(playerName);
    setIsImpostor(isCurrentPlayerImposter);

    // Simulate word assignment
    setTimeout(() => {
      if (isCurrentPlayerImposter) {
        setSecretWord("IMPOSTER");
      } else {
        setSecretWord(getRandomWord());
      }
      startTimer();
    }, 1000);
  };

  const startTimer = () => {
    setTimer(10);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGamePhase("clue");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startVoting = () => {
    setGamePhase("voting");
  };

  const submitVote = (votedPlayerId: number) => {
    setVotes((prev) => ({ ...prev, [playerName]: votedPlayerId }));
    // Simulate game end
    setTimeout(() => {
      setGamePhase("results");
      setGameResult({
        impostor: "Charlie",
        caught: true,
        votes: { Alice: 3, Bob: 3, Charlie: 1 },
      });
    }, 2000);
  };

  const resetGame = () => {
    setGamePhase("lobby");
    setSecretWord("");
    setIsImpostor(false);
    setTimer(10);
    setCurrentTurn(0);
    setVotes({});
    setGameResult(null);
    setIsHost(false);
    setGameMode("1-imposter");
    clearError();
    stopPlayerPolling();
  };

  const leaveGame = async () => {
    // Try to notify server that player is leaving
    if (roomCode && playerName) {
      try {
        await apiService.leaveRoom(roomCode, playerName);
      } catch (err) {
        console.error("Failed to notify server about leaving:", err);
      }
    }

    stopPlayerPolling();
    setGamePhase("lobby");
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
    setGameMode("1-imposter");
    clearError();
  };

  const renderLobby = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Game Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Imposter oldog game gsh
          </h1>
        </div>

        {/* Game Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Word Categories Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white/90 text-sm font-medium mb-3 text-center">
                🎯 Word Categories
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <span className="text-yellow-400">🐾 Animals</span>
                </div>
                <div className="text-center">
                  <span className="text-green-400">🍽️ Foods</span>
                </div>
                <div className="text-center">
                  <span className="text-blue-400">🏔️ Places</span>
                </div>
                <div className="text-center">
                  <span className="text-purple-400">📱 Objects</span>
                </div>
              </div>
              <p className="text-white/60 text-xs text-center mt-2">
                You&apos;ll get Mongolian words from these categories!
              </p>
            </div>

            {/* Create Game Button */}
            <button
              onClick={createGame}
              disabled={loading || !playerName.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Game...
                </span>
              ) : (
                "🎮 Create New Game"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/10 text-white/60">or</span>
              </div>
            </div>

            {/* Join Game Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              <button
                onClick={joinGame}
                disabled={loading || !roomCode || !playerName.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Joining...
                  </span>
                ) : (
                  "🚪 Join Game"
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-red-200 text-center">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Game Info */}
      </div>
    </div>
  );

  const renderWaitingRoom = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Waiting Room</h2>
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20">
            <span className="text-white/80 mr-2">Room Code:</span>
            <span className="font-mono font-bold text-2xl text-yellow-400 tracking-widest">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Players Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            Players ({players.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  player.isHost
                    ? "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/50"
                    : "bg-white/10 border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                      👑 Host
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Preview Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            🎯 Word Categories Preview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-yellow-400 text-2xl mb-2">🐾</div>
              <div className="text-white/80 text-sm font-medium mb-2">
                Animals
              </div>
              <div className="text-white/60 text-xs">
                {MONGOLIAN_WORDS.animals[0]}
              </div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-2xl mb-2">🍽️</div>
              <div className="text-white/80 text-sm font-medium mb-2">
                Foods
              </div>
              <div className="text-white/60 text-xs">
                {MONGOLIAN_WORDS.foods[0]}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 text-2xl mb-2">🏔️</div>
              <div className="text-white/80 text-sm font-medium mb-2">
                Places
              </div>
              <div className="text-white/60 text-xs">
                {MONGOLIAN_WORDS.places[0]}
              </div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-2xl mb-2">📱</div>
              <div className="text-white/80 text-sm font-medium mb-2">
                Objects
              </div>
              <div className="text-white/60 text-xs">
                {MONGOLIAN_WORDS.objects[0]}
              </div>
            </div>
          </div>
          <p className="text-white/60 text-xs text-center mt-4">
            You&apos;ll get one of these Mongolian words during the game!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {/* Game Mode Selection - Only visible to host */}
          {isHost && players.length >= 2 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-4">
              <h3 className="text-white font-semibold mb-4">🎮 Game Mode</h3>
              <div className="flex justify-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="1-imposter"
                    checked={gameMode === "1-imposter"}
                    onChange={(e) =>
                      setGameMode(e.target.value as "1-imposter" | "2-imposter")
                    }
                    className="mr-2"
                  />
                  <span className="text-white">1 Imposter</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="2-imposter"
                    checked={gameMode === "2-imposter"}
                    onChange={(e) =>
                      setGameMode(e.target.value as "1-imposter" | "2-imposter")
                    }
                    className="mr-2"
                    disabled={players.length < 5}
                  />
                  <span
                    className={`${
                      players.length < 5 ? "text-white/50" : "text-white"
                    }`}
                  >
                    2 Imposters {players.length < 5 && `(Need 5+ players)`}
                  </span>
                </label>
              </div>
            </div>
          )}

          {players.length >= 2 && isHost && (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg"
            >
              🚀 Start Game
            </button>
          )}

          {players.length < 2 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-center">
                ⏳ Waiting for more players to join... (Need at least 2 players)
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {!isHost && players.length >= 2 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-center">
                ⏳ Waiting for the host to start the game...
              </p>
            </div>
          )}

          {/* Go Back Button */}
          <button
            onClick={leaveGame}
            className="px-6 py-3 bg-white/10 text-white/80 font-medium rounded-xl hover:bg-white/20 border border-white/20 transition-all duration-200"
          >
            ← Go Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Word Display Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Word</h2>
          <div className="text-6xl font-bold text-yellow-400 mb-6 font-mono tracking-wider">
            {secretWord}
          </div>
          {secretWord && secretWord !== "IMPOSTER" && (
            <div className="inline-flex items-center px-6 py-3 bg-green-500/20 border border-green-400/30 rounded-full mb-4">
              <span className="text-green-300 font-medium text-lg">
                📚 Category:{" "}
                {(() => {
                  const category = getWordCategory(secretWord);
                  return category
                    ? category.charAt(0).toUpperCase() + category.slice(1)
                    : "Unknown";
                })()}
              </span>
            </div>
          )}
          {isImpostor && (
            <div className="inline-flex items-center px-6 py-3 bg-red-500/20 border border-red-400/30 rounded-full">
              <span className="text-red-300 font-medium text-lg">
                🎭 You are the IMPOSTER! Make up clues!
              </span>
            </div>
          )}
        </div>

        {/* Timer Card */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-400/30 shadow-2xl">
          <h3 className="font-semibold text-white mb-4 text-xl">
            Time Remaining
          </h3>
          <div className="text-5xl font-bold text-cyan-400 mb-4 font-mono">
            {timer}s
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${(timer / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-white/80">
            Think of a subtle clue about your word...
          </p>
        </div>
      </div>
    </div>
  );

  const renderCluePhase = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Clue Phase</h2>
          <p className="text-blue-200 text-lg">
            Take turns giving one-sentence clues
          </p>
        </div>

        {/* Word Reminder Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            🎯 Your Word
          </h3>
          <div className="text-4xl font-bold text-yellow-400 mb-3 font-mono tracking-wider">
            {secretWord}
          </div>
          {secretWord && secretWord !== "IMPOSTER" && (
            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full">
              <span className="text-green-300 font-medium text-sm">
                📚 Category:{" "}
                {(() => {
                  const category = getWordCategory(secretWord);
                  return category
                    ? category.charAt(0).toUpperCase() + category.slice(1)
                    : "Unknown";
                })()}
              </span>
            </div>
          )}
          {isImpostor && (
            <div className="inline-flex items-center px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-full mt-2">
              <span className="text-red-300 font-medium text-sm">
                🎭 You are the IMPOSTER! Make up clues!
              </span>
            </div>
          )}
        </div>

        {/* Player Order Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            Player Order
          </h3>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  index === currentTurn
                    ? "bg-gradient-to-r from-blue-400/20 to-cyan-500/20 border-blue-400/50 shadow-lg"
                    : "bg-white/10 border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-lg">
                    {player.name}
                  </span>
                  {index === currentTurn && (
                    <span className="flex items-center text-blue-300 font-medium">
                      <span className="animate-pulse mr-2">🎤</span>
                      Speaking now
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startVoting}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg"
          >
            🗳️ Start Voting
          </button>
        </div>
      </div>
    </div>
  );

  const renderVoting = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Vote for the Imposter
          </h2>
          <p className="text-blue-200 text-lg">Who do you think is lying?</p>
        </div>

        <div className="space-y-4">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => submitVote(player.id)}
              disabled={!!votes[playerName]}
              className={`
                w-full p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  votes[playerName] === player.id
                    ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 shadow-lg"
                    : "bg-white/10 border-white/20 hover:border-blue-400/50 hover:bg-blue-500/10"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-lg">
                  {player.name}
                </span>
                {votes[playerName] === player.id && (
                  <span className="text-red-300 font-bold">✓ Voted</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {Object.keys(votes).length > 0 && (
          <div className="mt-6 text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-white/80">⏳ Waiting for all votes...</p>
              <div className="mt-2 flex justify-center">
                <div className="animate-spin rounded-full h-6 h-6 border-b-2 border-white"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Results Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
          <h2 className="text-3xl font-bold text-white mb-6">Game Results</h2>

          {gameResult?.caught ? (
            <div className="text-green-400 mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-2xl font-bold mb-2">Imposter Caught!</p>
              <p className="text-xl">
                {gameResult?.impostor} was the imposter!
              </p>
            </div>
          ) : (
            <div className="text-red-400 mb-6">
              <div className="text-6xl mb-4">😈</div>
              <p className="text-2xl font-bold mb-2">Imposter Escaped!</p>
              <p className="text-xl">{gameResult?.impostor} fooled everyone!</p>
            </div>
          )}

          {/* Vote Details */}
          <div className="mt-6 text-left bg-white/5 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3 text-center">
              Vote Details
            </h4>
            {gameResult &&
              gameResult.votes &&
              Object.entries(gameResult.votes).map(([voter, voted]) => (
                <p key={voter} className="text-white/80 text-sm mb-1">
                  <span className="text-white">{voter}</span> voted for{" "}
                  <span className="text-white">
                    {players.find((p) => p.id === voted)?.name}
                  </span>
                </p>
              ))}
          </div>
        </div>

        <button
          onClick={resetGame}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );

  return (
    <>
      {gamePhase === "lobby" && renderLobby()}
      {gamePhase === "waiting" && renderWaitingRoom()}
      {gamePhase === "game" && renderGame()}
      {gamePhase === "clue" && renderCluePhase()}
      {gamePhase === "voting" && renderVoting()}
      {gamePhase === "results" && renderResults()}
    </>
  );
}
