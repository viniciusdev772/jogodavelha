import { useEffect, useState } from "react";
import io from "socket.io-client";
import Confetti from "react-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VirtualKeyboard from "../components/VirtualKeyboard";
import HangmanDrawing from "../components/HangmanDrawing";

const socket = io("https://jogo.viniciusdev.com.br");

const TextInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
  />
);

const Button = ({ onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4 ${className}`}
  >
    {children}
  </button>
);

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get("roomId");
    if (roomIdFromUrl) {
      setPendingRoomId(roomIdFromUrl);
      setShowUsernameInput(true);
    }

    socket.emit("requestWords");
    socket.on("wordsData", (data) => setWords(data.words));
    socket.on("totalPlayers", (count) => setTotalPlayers(count));
    socket.on("wordGuessed", handleWordGuessed);

    return () => {
      socket.off("wordsData");
      socket.off("totalPlayers");
      socket.off("wordGuessed");
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      socket.emit("joinRoom", { roomId, username }, handleJoinRoom);

      socket.on("init", (state) => setGameState(state));
      socket.on("update", (state) => setGameState(state));
      socket.on("playerCount", (count) => setPlayerCount(count));
      socket.on("playerAction", (message) => toast.info(message));
      socket.on("roomDestroyed", handleRoomDestroyed);

      return () => {
        socket.off("init");
        socket.off("update");
        socket.off("playerCount");
        socket.off("playerAction");
        socket.off("roomDestroyed");
      };
    }
  }, [roomId]);

  const handleWordGuessed = (username) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 15000);
    toast.success(`${username} acertou a palavra!`);
    setWordGuessed(true);
  };

  const handleJoinRoom = (success) => {
    if (!success) {
      alert(
        "A sala não foi encontrada. Caso tenha certeza que ela existe, recarregue a página e tente novamente."
      );
      setRoomId("");
    }
  };

  const handleRoomDestroyed = () => {
    alert("A sala foi destruída pelo criador.");
    setRoomId("");
    setGameState(null);
    setGuess("");
    setPlayerCount(0);
    setShowConfetti(false);
    setCustomWord("");
    setIsCreator(false);
    setWordGuessed(false);
  };

  const handleGuess = (letter) => {
    if (
      !gameState.guessedLetters.includes(letter) &&
      !gameState.word.includes(letter)
    ) {
      socket.emit("guess", { roomId, letter, username });
    } else {
      toast.error("Você já tentou essa letra!");
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
        handleCreateRoom
      );
    }
  };

  const handleCreateRoom = (newRoomId) => {
    setRoomId(newRoomId);
    setIsCreator(true);
  };

  const joinRoom = () => {
    if (!username) {
      setIsCreator(false);
      setShowUsernameInput(true);
    } else {
      socket.emit(
        "joinRoom",
        { roomId: pendingRoomId, username },
        handleJoinRoom
      );
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
        handleJoinRoom
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
      handleCreateRoom
    );
  };

  if (showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <TextInput
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nome de Usuário"
        />
        <Button onClick={handleUsernameSubmit}>
          Confirmar Nome de Usuário
        </Button>
      </div>
    );
  }

  if (!roomId && !showUsernameInput) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <div className="mb-4">Total de Jogadores: {totalPlayers}</div>
        <TextInput
          value={pendingRoomId}
          onChange={(e) => setPendingRoomId(e.target.value)}
          placeholder="ID da Sala"
        />
        <Button onClick={joinRoom}>Entrar na Sala</Button>
        <TextInput
          value={customWord}
          onChange={(e) => setCustomWord(e.target.value)}
          placeholder="Digite a palavra para a sala"
        />
        <Button onClick={createRoom}>Criar Sala</Button>
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
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
      <ToastContainer />
      {showConfetti && <Confetti />}
      <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
      <div className="text-2xl mb-4">
        Palavra: <span className="font-mono">{displayWord}</span>
      </div>
      <div className="text-2xl mb-4">Erros: {incorrectGuesses}</div>
      <div className="text-2xl mb-4">
        Letras Digitadas: {guessedLetters.join(", ")}
      </div>
      <div className="text-2xl mb-4">Jogadores na Sala: {playerCount}</div>
      <div className="text-2xl mb-4">Total de Jogadores: {totalPlayers}</div>
      <VirtualKeyboard
        onKeyPress={handleGuess}
        guessedLetters={guessedLetters}
      />
      <div className="text-2xl mt-4">
        Sala: <span className="font-mono">{roomId}</span>
      </div>
      {isCreator && (
        <div className="flex flex-col items-center mt-4">
          <Button onClick={destroyRoom} className="bg-red-600">
            Destruir Sala
          </Button>
          <Button onClick={copyRoomLink}>Copiar Link da Sala</Button>
          <Button onClick={startNewGame} className="bg-green-600">
            Iniciar Novo Jogo
          </Button>
        </div>
      )}
    </div>
  );
}
