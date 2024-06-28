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
        }
      });

      socket.on("init", (state) => {
        setGameState(state);
      });

      socket.on("update", (state) => {
        setGameState(state);
      });

      socket.on("playerCount", (count) => {
        setPlayerCount(count);
      });

      socket.on("playerAction", (message) => {
        toast.info(message);
      });

      socket.on("roomDestroyed", () => {
        alert("A sala foi destruída pelo criador.");
        setRoomId("");
        setGameState(null);
        setGuess("");
        setPlayerCount(0);
        setShowConfetti(false);
        setCustomWord("");
        setIsCreator(false);
        setWordGuessed(false);
      });

      return () => {
        socket.off("init");
        socket.off("update");
        socket.off("playerCount");
        socket.off("playerAction");
        socket.off("wordsData");
        socket.off("totalPlayers");
        socket.off("roomDestroyed");
        socket.off("wordGuessed");
      };
    }
  }, [roomId]);

  const handleGuess = (letter) => {
    if (!guessedLetters.includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]); // Adiciona a letra adivinhada
      socket.emit("guess", { roomId, letter, username });
    }
  };

  const createRoom = () => {
    if (!username) {
      setIsCreator(true);
      setShowUsernameInput(true);
    } else {
      if (customWord.includes(" ")) {
        toast.error("A palavra não pode conter espaços!");
        return;
      }
      socket.emit(
        "createRoom",
        { word: customWord.toUpperCase(), username },
        (newRoomId) => {
          setRoomId(newRoomId);
          setIsCreator(true);
        }
      );
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

  const destroyRoom = () => {
    socket.emit("destroyRoom", { roomId });
  };

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/?roomId=${roomId}`;
    navigator.clipboard.writeText(roomLink);
    toast.success("Link da sala copiado para a área de transferência!");
  };

  const startNewGame = () => {
    setWordGuessed(false);
    setShowConfetti(false);
    socket.emit(
      "createRoom",
      { word: customWord.toUpperCase(), username },
      (newRoomId) => {
        setRoomId(newRoomId);
        setIsCreator(true);
      }
    );
  };

  if (showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <input
          type="text"
          placeholder="Nome de Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
        />
        <button
          onClick={handleUsernameSubmit}
          className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
        >
          Confirmar Nome de Usuário
        </button>
      </div>
    );
  }

  if (!roomId && !showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <div className="mb-4">Total de Jogadores: {totalPlayers}</div>
        <input
          type="text"
          placeholder="ID da Sala"
          value={pendingRoomId}
          onChange={(e) => setPendingRoomId(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
        />
        <button
          onClick={joinRoom}
          className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
        >
          Entrar na Sala
        </button>
        <input
          type="text"
          placeholder="Digite a palavra para a sala"
          value={customWord}
          onChange={(e) => setCustomWord(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
        />
        <button
          onClick={createRoom}
          className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
        >
          Criar Sala
        </button>
      </div>
    );
  }

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
