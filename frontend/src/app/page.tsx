"use client";

import { useState, useEffect } from "react";
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

  const { loading, error, executeApiCall, clearError } = useApi();

  // No auto-simulation - start in lobby
  useEffect(() => {
    // Initialize empty state
    setGamePhase("lobby");
    setPlayers([]);
  }, []);

  const createGame = async () => {
    if (!playerName.trim()) return;

    try {
      const result = await executeApiCall(apiService.createRoom, playerName);
      console.log("Game created:", result);
      if (result.roomCode) {
        setRoomCode(result.roomCode);
        setPlayers([{ id: 1, name: playerName, isHost: true }]);
        setGamePhase("waiting");
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
          setGamePhase("waiting");
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
    // Simulate word assignment
    setTimeout(() => {
      const random = Math.random();
      if (random < 0.33) {
        setIsImpostor(true);
        setSecretWord("IMPOSTER");
      } else {
        setIsImpostor(false);
        setSecretWord("Mongolian");
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

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {players.length >= 2 && (
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

          {/* Go Back Button */}
          <button
            onClick={() => {
              setGamePhase("lobby");
              setRoomCode("");
              setPlayers([]);
              clearError();
            }}
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
              className={`w-full p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
