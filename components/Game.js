import { useEffect, useState } from "react";
import io from "socket.io-client";
import Confetti from "react-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VirtualKeyboard from "../components/VirtualKeyboard";

const socket = io("https://jogo.viniciusdev.com.br");

export default function Game() {
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [customWord, setCustomWord] = useState("");
  const [username, setUsername] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [words, setWords] = useState([]);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState("");
  const [wordGuessed, setWordGuessed] = useState(false);
  const [guessedLetters, setGuessedLetters] = useState([]); // Novo estado

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get("roomId");
    if (roomIdFromUrl) {
      setPendingRoomId(roomIdFromUrl);
      setShowUsernameInput(true);
    }

    socket.emit("requestWords");
    socket.on("wordsData", (data) => {
      setWords(data.words);
    });

    socket.on("totalPlayers", (count) => {
      setTotalPlayers(count);
    });

    socket.on("wordGuessed", (username) => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 15000);
      toast.success(`${username} acertou a palavra!`);
      setWordGuessed(true);
    });

    if (roomId) {
      socket.emit("joinRoom", { roomId, username }, (success) => {
        if (!success) {
          alert(
            "a sala não foi encontrada. caso tenha certeza que ela existe recarregar a página e tentar novamente"
          );
          setRoomId("");
          setPendingRoomId("");
          setShowUsernameInput(true);
        }
      });
    }
  }, [roomId, username]);

  const handleGuess = (letter) => {
    if (!guessedLetters.includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]); // Adiciona a letra adivinhada
      socket.emit("guess", { roomId, letter });
    }
  };

  if (!gameState) return <div className="text-center text-2xl">Loading...</div>;

  const { word, incorrectGuesses } = gameState;
  const displayWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
      <ToastContainer />
      {showConfetti && <Confetti />}
      <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
      <div className="text-2xl mb-4">
        Palavra: <span className="font-mono">{displayWord}</span>
      </div>
      <div className="text-2xl mb-4">Erros: {incorrectGuesses}</div>
      <div className="text-2xl mb-4">Jogadores na Sala: {playerCount}</div>
      <div className="text-2xl mb-4">Total de Jogadores: {totalPlayers}</div>
      <div className="text-2xl mb-4">
        Letras Adivinhadas: {guessedLetters.join(", ")}
      </div>{" "}
      {/* Exibir letras adivinhadas */}
      <VirtualKeyboard
        onKeyPress={handleGuess}
        guessedLetters={guessedLetters}
      />{" "}
      {/* Passar letras adivinhadas */}
      <div className="text-2xl mt-4">
        Sala: <span className="font-mono">{roomId}</span>
      </div>
      {isCreator && (
        <div className="flex flex-col items-center mt-4">
          <button
            onClick={destroyRoom}
            className="bg-red-600 hover:bg-red-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
          >
            Destruir Sala
          </button>
          <button
            onClick={copyRoomLink}
            className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
          >
            Copiar Link da Sala
          </button>
          <button
            onClick={startNewGame}
            className="bg-green-600 hover:bg-green-700 transition duration-200 text-white rounded px-4 py-2"
          >
            Iniciar Novo Jogo
          </button>
        </div>
      )}
    </div>
  );
}
