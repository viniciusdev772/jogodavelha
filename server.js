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
let wordsData = { words: [], wins: {} };

if (fs.existsSync(dbFilePath)) {
  const fileData = fs.readFileSync(dbFilePath);
  wordsData = JSON.parse(fileData);
} else {
  fs.writeFileSync(dbFilePath, JSON.stringify(wordsData));
}

const wordList = [
  "ABACAXI",
  "ACAI",
  "BANANA",
  "CACAU",
  "CAJU",
  "CARAMBOLA",
  "COCO",
  "GOIABA",
  "JACA",
  "JAMBO",
  "LARANJA",
  "MANGA",
  "MARACUJA",
  "MURICI",
  "PITANGA",
  "SAPOTI",
  "TAMARINDO",
  "UMBU",
  "URUCUM",
  "CASTANHA",
  "GUARANA",
  "ACEROLA",
  "BACURI",
  "BURITI",
  "CUPUACU",
  "PEQUI",
  "PITOMBA",
  "SAPUCAIA",
  "TAPEREBA",
  "SERIGUELA",
  "GRAVIOLA",
  "SIRIGADO",
  "PIRARUCU",
  "TUCUPI",
  "TACACA",
  "CHIMARRAO",
  "FEIJOADA",
  "PAODEQUEIJO",
  "BRIGADEIRO",
  "PAMONHA",
];

function chooseRandomWord() {
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex];
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

function cleanUpEmptyRooms() {
  Object.keys(rooms).forEach((roomId) => {
    if (Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
    }
  });
}

io.on("connection", (socket) => {
  socket.on("requestWords", () => {
    socket.emit("wordsData", wordsData);
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
    if (gameState) {
      if (gameState.word.includes(letter)) {
        gameState.guessedLetters.push(letter);
      } else {
        gameState.incorrectGuesses += 1;
      }

      io.to(roomId).emit("update", gameState);
      io.to(roomId).emit(
        "playerAction",
        `${username} adivinhou a letra "${letter}"`
      );

      if (
        gameState.word
          .split("")
          .every((letter) => gameState.guessedLetters.includes(letter))
      ) {
        io.to(roomId).emit("wordGuessed", username);
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
        io.in(roomId).socketsLeave(roomId); // Disconectar todos os sockets da sala
        delete rooms[roomId];
        updateTotalPlayers();
      }, 1000); // Pequeno delay para garantir que a mensagem seja entregue
    }
  });

  socket.on("disconnecting", () => {
    const roomsToUpdate = [...socket.rooms].filter(
      (room) => room !== socket.id
    );
    roomsToUpdate.forEach((roomId) => {
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        updatePlayerCount(roomId);
      }
    });
  });

  socket.on("disconnect", () => {
    cleanUpEmptyRooms();
    updateTotalPlayers();
  });
});

app.prepare().then(() => {
  server.listen(9000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:9000");
  });
});
