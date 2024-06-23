const { createServer } = require("http");
const next = require("next");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  handle(req, res);
});

const io = socketIo(server);

let rooms = {};
const dbFilePath = path.join(__dirname, "data.json");
let wordsData = { words: [] };

if (fs.existsSync(dbFilePath)) {
  const fileData = fs.readFileSync(dbFilePath);
  wordsData = JSON.parse(fileData);
} else {
  fs.writeFileSync(dbFilePath, JSON.stringify(wordsData));
}

function chooseRandomWord() {
  const words = ["apple", "banana", "cherry", "date", "elderberry"];
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function initializeGame(word) {
  if (word && !wordsData.words.includes(word)) {
    wordsData.words.push(word);
    fs.writeFileSync(dbFilePath, JSON.stringify(wordsData));
  }
  return {
    word: word || chooseRandomWord(),
    guessedLetters: [],
    incorrectGuesses: 0,
    players: {},
  };
}

io.on("connection", (socket) => {
  socket.on("createRoom", (data, callback) => {
    const { word, username } = data;
    const roomId = Math.random().toString(36).substr(2, 9);
    rooms[roomId] = initializeGame(word);
    rooms[roomId].players[socket.id] = username;
    socket.join(roomId);
    if (typeof callback === "function") callback(roomId);
    io.to(roomId).emit("update", rooms[roomId]);
    io.to(roomId).emit(
      "playerCount",
      Object.keys(rooms[roomId].players).length
    );
  });

  socket.on("joinRoom", (data, callback) => {
    const { roomId, username } = data;
    if (rooms[roomId]) {
      rooms[roomId].players[socket.id] = username;
      socket.join(roomId);
      if (typeof callback === "function") callback(true);
      io.to(roomId).emit("update", rooms[roomId]);
      io.to(roomId).emit(
        "playerCount",
        Object.keys(rooms[roomId].players).length
      );
    } else {
      if (typeof callback === "function") callback(false);
    }
  });

  socket.on("guess", (data) => {
    const { roomId, letter, username } = data;
    const gameState = rooms[roomId];
    if (gameState.word.includes(letter)) {
      gameState.guessedLetters.push(letter);
    } else {
      gameState.incorrectGuesses += 1;
    }

    if (
      gameState.incorrectGuesses >= 6 ||
      gameState.word
        .split("")
        .every((letter) => gameState.guessedLetters.includes(letter))
    ) {
      io.to(roomId).emit("winner", username);
      rooms[roomId] = initializeGame(gameState.word);
    }

    io.to(roomId).emit("update", gameState);
    io.to(roomId).emit(
      "playerAction",
      `${username} adivinhou a letra "${letter}"`
    );
  });

  socket.on("disconnecting", () => {
    const roomsToUpdate = [...socket.rooms].filter(
      (room) => room !== socket.id
    );
    roomsToUpdate.forEach((roomId) => {
      delete rooms[roomId].players[socket.id];
      io.to(roomId).emit(
        "playerCount",
        Object.keys(rooms[roomId].players).length
      );
    });
  });

  socket.on("disconnect", () => {
    // Clean up empty rooms
    Object.keys(rooms).forEach((roomId) => {
      if (io.sockets.adapter.rooms.get(roomId) === undefined) {
        delete rooms[roomId];
      }
    });
  });
});

app.prepare().then(() => {
  server.listen(9000, (err) => {
    if (err) throw err;
    console.log("> Readdy on http://localhost:9000");
  });
});
