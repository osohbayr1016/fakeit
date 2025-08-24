import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here later
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Health check
  health: () => api.get("/health"),

  // Hello endpoint
  hello: () => api.get("/hello"),

  // Send data
  sendData: (data) => api.post("/data", { data }),

  // Get users
  getUsers: () => api.get("/users"),

  // Create a new game room
  createRoom: (playerName) => api.post("/rooms", { playerName }),

  // Join an existing room
  joinRoom: (roomCode, playerName) =>
    api.post("/rooms/join", { roomCode, playerName }),

  // Validate room code
  validateRoom: (roomCode) => api.get(`/rooms/${roomCode}/validate`),
};

export default api;
