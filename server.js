const { createServer } = require("http");
const next = require("next");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const express = require("express");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();
server.use(cookieParser());

const httpServer = createServer(server);

const io = socketIo(httpServer);

const dbFilePath = path.join(__dirname, "data.json");
const usersFilePath = path.join(__dirname, "users.json");

let rooms = {};
let wordsData = { words: [], wins: {} };
let usersData = {};

// Load or initialize data files
if (fs.existsSync(dbFilePath)) {
  wordsData = JSON.parse(fs.readFileSync(dbFilePath));
} else {
  fs.writeFileSync(dbFilePath, JSON.stringify(wordsData));
}

if (fs.existsSync(usersFilePath)) {
  usersData = JSON.parse(fs.readFileSync(usersFilePath));
} else {
  fs.writeFileSync(usersFilePath, JSON.stringify(usersData));
}

function saveUsersData() {
  fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
}

function chooseRandomWord() {
  const words = ["ABACAXI", "ACAI", "BANANA", /* ... other words ... */];
  return words[Math.floor(Math.random() * words.length)];
}

function initializeGame(word) {
  return {
    word: word || chooseRandomWord(),
    guessedLetters: [],
    incorrectGuesses: 0,
    players: {},
  };
}

function updateTotalPlayers() {
  const totalPlayers = Object.values(rooms).reduce(
    (sum, room) => sum + Object.keys(room.players).length,
    0
  );
  io.emit("totalPlayers", totalPlayers);
}

function updatePlayerCount(roomId) {
  const playerCount = Object.keys(rooms[roomId]?.players || {}).length;
  io.to(roomId).emit("playerCount", playerCount);
}

function addXp(username, xp) {
  const user = usersData[username];
  if (user) {
    user.xp += xp;
    while (user.xp >= user.level * 10) {
      user.xp -= user.level * 10;
      user.level++;
    }
    saveUsersData();
  }
}

io.on("connection", (socket) => {
  socket.on("register", async ({ username, password }, callback) => {
    if (usersData[username]) {
      callback({ success: false, message: "Username already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      usersData[username] = { password: hashedPassword, level: 1, xp: 0 };
      saveUsersData();
      callback({ success: true });
    }
  });

  socket.on("login", async ({ username, password }, callback) => {
    const user = usersData[username];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username }, "secretKey", { expiresIn: "1h" });
      socket.emit('setCookie', { token });
      callback({ success: true, token, level: user.level, xp: user.xp });
    } else {
      callback({ success: false, message: "Invalid credentials" });
    }
  });

  socket.on("createRoom", (data, callback) => {
    const { word, username } = data;
    const roomId = Math.random().toString(36).substr(2, 9);
    rooms[roomId] = initializeGame(word);
    rooms[roomId].players[socket.id] = username;
    socket.join(roomId);
    if (typeof callback === "function") callback(roomId);
    io.to(roomId).emit("update", rooms[roomId]);
    updatePlayerCount(roomId);
    updateTotalPlayers();
  });

  socket.on("joinRoom", (data, callback) => {
    const { roomId, username } = data;
    if (rooms[roomId]) {
      rooms[roomId].players[socket.id] = username;
      socket.join(roomId);
      if (typeof callback === "function") callback(true);
      io.to(roomId).emit("update", rooms[roomId]);
      updatePlayerCount(roomId);
      updateTotalPlayers();
    } else {
      if (typeof callback === "function") callback(false);
    }
  });

  socket.on("guess", (data) => {
    const { roomId, letter, username } = data;
    const gameState = rooms[roomId];
    if (gameState && !gameState.guessedLetters.includes(letter)) {
      gameState.guessedLetters.push(letter);

      if (!gameState.word.includes(letter)) {
        gameState.incorrectGuesses += 1;
      }

      io.to(roomId).emit("update", gameState);
      io.to(roomId).emit("playerAction", `${username} adivinhou a letra "${letter}"`);
      io.to(roomId).emit("guessedLetters", gameState.guessedLetters);

      // Verifica se todas as letras foram adivinhadas
      if (gameState.word.split("").every((l) => gameState.guessedLetters.includes(l))) {
        io.to(roomId).emit("wordGuessed", username);
        addXp(username, 10);  // Aumenta o XP quando a palavra é adivinhada
        const updatedUser = usersData[username];
        io.to(socket.id).emit("updateUser", { level: updatedUser.level, xp: updatedUser.xp });
      }
    } else {
      console.error(`gameState is undefined for roomId: ${roomId}`);
    }
  });

  socket.on("destroyRoom", (data) => {
    const { roomId } = data;
    if (rooms[roomId]) {
      io.to(roomId).emit("roomDestroyed");
      setTimeout(() => {
        io.in(roomId).socketsLeave(roomId);
        delete rooms[roomId];
        updateTotalPlayers();
      }, 1000);
    }
  });

  socket.on("disconnecting", () => {
    const roomsToUpdate = [...socket.rooms].filter((room) => room !== socket.id);
    roomsToUpdate.forEach((roomId) => {
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        updatePlayerCount(roomId);
      }
    });
  });

  socket.on("disconnect", () => {
    Object.keys(rooms).forEach((roomId) => {
      if (!io.sockets.adapter.rooms.get(roomId)) {
        delete rooms[roomId];
      }
    });
    updateTotalPlayers();
  });
});

server.all('*', (req, res) => {
  return handle(req, res);
});

app.prepare().then(() => {
  httpServer.listen(9000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:9000");
  });
});