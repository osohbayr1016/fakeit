# FakeIt - Social Impostor Word Game

A real-time multiplayer web game where players give subtle clues about a secret word, except for one player (the impostor) who must make it up. After all hints are shared, players vote to expose the faker!

## 🎮 Game Concept

- **Objective**: Identify the impostor among players
- **Setup**: Each player gets the same secret word, except the impostor who sees "IMPOSTER"
- **Gameplay**: Players take turns giving one-sentence clues about their word
- **Voting**: After clues, vote on who you think is the impostor
- **Winning**: Catch the impostor or let them escape!

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (Next.js)
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: WebSocket communication via Socket.IO
- **Database**: MongoDB (for game history and word storage)
- **Mobile**: Responsive design for mobile-first experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (optional for basic functionality)

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp env.example .env
```

4. Start the development server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🎯 Features

### Core Gameplay

- **Room System**: 6-digit room codes for easy joining
- **Real-time Sync**: Live updates across all players
- **Role Assignment**: Random impostor selection
- **Timer System**: Configurable clue time limits
- **Voting Mechanism**: Anonymous voting system
- **Game Results**: Detailed outcome display

### User Experience

- **Mobile-First**: Responsive design for all devices
- **No Login Required**: Quick join with name only
- **Real-time Updates**: Instant game state synchronization
- **Intuitive UI**: Clear game phases and instructions
- **Accessibility**: High contrast and readable text

## 🔧 Technical Implementation

### Backend Structure

```
backend/
├── server.js          # Main Express server
├── routes/
│   └── api.js        # API endpoints
├── middleware/
│   └── errorHandler.js # Error handling
├── package.json       # Dependencies
└── README.md         # Backend documentation
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── page.tsx  # Main game interface
│   ├── services/
│   │   └── api.js    # API communication
│   └── hooks/
│       └── useApi.js # Custom API hook
├── package.json       # Dependencies
└── README.md         # Frontend documentation
```

### API Endpoints

- `GET /api/health` - Server health check
- `GET /api/hello` - Sample endpoint
- `POST /api/data` - Data submission
- `GET /api/users` - Sample user data

## 🎨 Game Flow

1. **Lobby**: Create or join a game room
2. **Waiting Room**: Wait for players and host to start
3. **Word Assignment**: Secret words distributed (impostor gets "IMPOSTER")
4. **Clue Phase**: Timer-based clue giving
5. **Voting**: Anonymous voting on suspected impostor
6. **Results**: Game outcome and statistics
7. **Reset**: Option to play again

## 🔌 Real-time Communication

The game uses WebSocket connections for:

- Player join/leave notifications
- Game state updates
- Timer synchronization
- Vote collection
- Real-time results

## 📱 Mobile Optimization

- Touch-friendly buttons and inputs
- Responsive layout for all screen sizes
- Optimized for portrait orientation
- Fast loading and smooth animations

## 🚧 Development Roadmap

### Phase 1 (Current)

- ✅ Basic game structure
- ✅ Frontend-backend connection
- ✅ Game flow simulation
- ✅ Mobile-responsive UI

### Phase 2 (Next)

- [ ] Socket.IO integration
- [ ] Real-time multiplayer
- [ ] MongoDB integration
- [ ] Word database

### Phase 3 (Future)

- [ ] User accounts
- [ ] Game statistics
- [ ] Custom word lists
- [ ] Advanced game modes

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing

1. Open multiple browser windows
2. Join the same room code
3. Test game flow end-to-end
4. Verify real-time updates

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

- Check if port 5000 is available
- Verify all dependencies are installed
- Check environment variables

**Frontend can't connect to backend:**

- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API endpoint URLs

**Game not syncing:**

- Check WebSocket connections
- Verify room code matching
- Check browser console for errors

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:

- Check the troubleshooting section
- Review the code documentation
- Open an issue on GitHub

---

**Happy Gaming! 🎲**
