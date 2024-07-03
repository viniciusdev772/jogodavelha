import { useEffect, useState } from "react";
import io from "socket.io-client";
import Confetti from "react-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import VirtualKeyboard from "../components/VirtualKeyboard";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import Profile from "../components/Profile";

const socket = io("https://jogo.viniciusdev.com.br");

export default function Game() {
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [customWord, setCustomWord] = useState("");
  const [username, setUsername] = useState("");
  const [jafoi, setJafoi] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [words, setWords] = useState([]);
  const [pendingRoomId, setPendingRoomId] = useState("");
  const [wordGuessed, setWordGuessed] = useState(false);
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      // Assuming the token contains the user info encoded
      const userInfo = JSON.parse(atob(token.split(".")[1]));
      setUser({
        username: userInfo.username,
        token,
        level: userInfo.level,
        xp: userInfo.xp,
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get("roomId");
    if (roomIdFromUrl) {
      setPendingRoomId(roomIdFromUrl);
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

    socket.on("guessedLetters", (letters) => {
      setJafoi(letters);
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

      socket.on("updateUser", (data) => {
        setUser((prevUser) => ({
          ...prevUser,
          level: data.level,
          xp: data.xp,
        }));
      });

      socket.on("setCookie", ({ token }) => {
        Cookies.set("token", token, { expires: 1 });
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
        socket.off("guessedLetters");
        socket.off("updateUser");
        socket.off("setCookie");
      };
    }
  }, [roomId]);

  const handleGuess = (letter) => {
    socket.emit("guess", { roomId, letter, username });
  };

  const createRoom = () => {
    if (!username) {
      setIsCreator(true);
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
    } else {
      socket.emit("joinRoom", { roomId, username }, (success) => {
        if (!success) {
          alert("Room not found");
          setRoomId("");
        }
      });
    }
  };

  const handleLogin = (data) => {
    socket.emit("login", data, (response) => {
      if (response.success) {
        setUser({
          username: data.username,
          token: response.token,
          level: response.level,
          xp: response.xp,
        });
        Cookies.set("token", response.token, { expires: 1 });
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleRegister = (data) => {
    socket.emit("register", data, (response) => {
      if (response.success) {
        toast.success(
          "Cadastro realizado com sucesso! Faça login para continuar."
        );
        setIsRegistering(false);
      } else {
        toast.error(response.message);
      }
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        {isRegistering ? (
          <RegisterForm onRegister={handleRegister} />
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mt-4"
        >
          {isRegistering ? "Já tenho uma conta" : "Criar uma conta"}
        </button>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <Profile user={user} />
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
      <Profile user={user} />
      <div className="text-2xl mb-4">
        Palavra: <span className="font-mono">{displayWord}</span>
      </div>
      <div className="text-2xl mb-4">Erros: {incorrectGuesses}</div>
      <div className="text-2xl mb-4">Jogadores na Sala: {playerCount}</div>
      <div className="text-2xl mb-4">Total de Jogadores: {totalPlayers}</div>
      <div className="text-2xl mb-4">
        Letras já adivinhadas: {jafoi.join(", ")}
      </div>
      <VirtualKeyboard onKeyPress={handleGuess} />
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
