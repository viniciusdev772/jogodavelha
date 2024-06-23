import { useEffect, useState } from "react";
import io from "socket.io-client";
import Confetti from "react-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:3000");

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
  const [pendingRoomId, setPendingRoomId] = useState(""); // Novo estado para armazenar o roomId pendente

  useEffect(() => {
    socket.emit("requestWords");
    socket.on("wordsData", (data) => {
      setWords(data.words);
    });

    socket.on("totalPlayers", (count) => {
      setTotalPlayers(count);
    });

    if (roomId) {
      socket.emit("joinRoom", { roomId, username }, (success) => {
        if (!success) {
          alert("Room not found");
          setRoomId("");
        }
      });

      socket.on("init", (state) => {
        setGameState(state);
      });

      socket.on("update", (state) => {
        setGameState(state);
        if (
          state.word
            .split("")
            .every((letter) => state.guessedLetters.includes(letter))
        ) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      });

      socket.on("playerCount", (count) => {
        setPlayerCount(count);
      });

      socket.on("playerAction", (message) => {
        toast.info(message);
      });

      socket.on("winner", (winner) => {
        toast.success(`${winner} venceu!`);
      });

      return () => {
        socket.off("init");
        socket.off("update");
        socket.off("playerCount");
        socket.off("playerAction");
        socket.off("winner");
        socket.off("wordsData");
        socket.off("totalPlayers");
      };
    }
  }, [roomId]);

  const handleGuess = () => {
    if (guess) {
      socket.emit("guess", { roomId, letter: guess, username });
      setGuess("");
    }
  };

  const createRoom = () => {
    if (!username) {
      setIsCreator(true);
      setShowUsernameInput(true);
    } else {
      socket.emit("createRoom", { word: customWord, username }, (newRoomId) => {
        setRoomId(newRoomId);
      });
    }
  };

  const joinRoom = () => {
    if (!username) {
      setIsCreator(false);
      setShowUsernameInput(true);
    } else {
      socket.emit("joinRoom", { roomId, username }, (success) => {
        if (!success) {
          alert("Room not found");
          setRoomId("");
        }
      });
    }
  };

  const handleUsernameSubmit = () => {
    setShowUsernameInput(false);
    if (isCreator) {
      createRoom();
    } else {
      socket.emit(
        "joinRoom",
        { roomId: pendingRoomId, username },
        (success) => {
          if (!success) {
            alert("Room not found");
            setPendingRoomId("");
          } else {
            setRoomId(pendingRoomId);
          }
        }
      );
    }
  };

  if (showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-200 text-black">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <input
          type="text"
          placeholder="Nome de Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4"
        />
        <button
          onClick={handleUsernameSubmit}
          className="bg-blue-500 text-white rounded px-4 py-2 mb-4"
        >
          Confirmar Nome de Usuário
        </button>
      </div>
    );
  }

  if (!roomId && !showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-200 text-black">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <div className="mb-4">Total de Jogadores: {totalPlayers}</div>
        <input
          type="text"
          placeholder="ID da Sala"
          value={pendingRoomId}
          onChange={(e) => setPendingRoomId(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4"
        />
        <button
          onClick={joinRoom}
          className="bg-blue-500 text-white rounded px-4 py-2 mb-4"
        >
          Entrar na Sala
        </button>
        <input
          type="text"
          placeholder="Digite a palavra para a sala"
          value={customWord}
          onChange={(e) => setCustomWord(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4"
        />
        <button
          onClick={createRoom}
          className="bg-blue-500 text-white rounded px-4 py-2 mb-4"
        >
          Criar Sala
        </button>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Palavras Criadas:</h2>
          <ul className="list-disc">
            {words.map((word, index) => (
              <li key={index}>{word}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="text-center text-2xl">Loading...</div>;

  const { word, guessedLetters, incorrectGuesses } = gameState;
  const displayWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200 text-black">
      <ToastContainer />
      {showConfetti && <Confetti />}
      <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
      <div className="text-2xl mb-4">
        Palavra: <span className="font-mono">{displayWord}</span>
      </div>
      <div className="text-2xl mb-4">Erros: {incorrectGuesses}</div>
      <div className="text-2xl mb-4">Jogadores: {playerCount}</div>
      <div className="flex">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={1}
          className="border border-gray-400 rounded px-4 py-2 mr-2"
        />
        <button
          onClick={handleGuess}
          className="bg-blue-500 text-white rounded px-4 py-2"
        >
          Adivinhar
        </button>
      </div>
      <div className="text-2xl mt-4">
        Sala: <span className="font-mono">{roomId}</span>
      </div>
    </div>
  );
}
