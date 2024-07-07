import { useEffect, useState } from "react";
import io from "socket.io-client";
import Confetti from "react-confetti";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import VirtualKeyboard from "../components/VirtualKeyboard";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import Profile from "../components/Profile";

const socket = io("https://jogo.viniciusdev.com.br", {
  transports: ["websocket"],
});

const pageVariants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: 20,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

export default function Game() {
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [roomId, setRoomId] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [customWord, setCustomWord] = useState("");
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

    return () => {
      socket.off("wordsData");
      socket.off("totalPlayers");
      socket.off("wordGuessed");
      socket.off("guessedLetters");
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      socket.emit(
        "joinRoom",
        { roomId, username: user.username },
        (success) => {
          if (!success) {
            alert(
              "A sala não foi encontrada. Caso tenha certeza que ela existe, recarregue a página e tente novamente."
            );
            setRoomId("");
          }
        }
      );

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

      return () => {
        socket.off("init");
        socket.off("update");
        socket.off("playerCount");
        socket.off("playerAction");
        socket.off("roomDestroyed");
        socket.off("updateUser");
      };
    }
  }, [roomId, user]);

  const handleGuess = (letter) => {
    socket.emit("guess", { roomId, letter, username: user.username });
  };

  const createRoom = () => {
    if (!user.username) {
      toast.error("Você precisa estar logado para criar uma sala!");
      return;
    }
    if (customWord.includes(" ")) {
      toast.error("A palavra não pode conter espaços!");
      return;
    }
    socket.emit(
      "createRoom",
      { word: customWord.toUpperCase(), username: user.username },
      (newRoomId) => {
        setRoomId(newRoomId);
        setIsCreator(true);
      }
    );
  };

  const joinRoom = () => {
    if (!user.username) {
      toast.error("Você precisa estar logado para entrar em uma sala!");
      return;
    }
    socket.emit(
      "joinRoom",
      { roomId: pendingRoomId, username: user.username },
      (success) => {
        if (!success) {
          alert("Sala não encontrada");
          setPendingRoomId("");
        } else {
          setRoomId(pendingRoomId);
        }
      }
    );
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
      <motion.div
        className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
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
      </motion.div>
    );
  }

  if (!roomId) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <ToastContainer />
        <h1 className="text-4xl font-bold mb-8">Jogo da Forca</h1>
        <Profile username={user.username} />
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
      </motion.div>
    );
  }

  if (!gameState) return <div className="text-center text-2xl">Loading...</div>;

  const { word, guessedLetters, incorrectGuesses } = gameState;
  const displayWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
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
        Letras já adivinhadas: {jafoi.join(", ")}
      </div>
      <VirtualKeyboard onKeyPress={handleGuess} />
      <div className="text-2xl mt-4">
        Sala: <span className="font-mono">{roomId}</span>
      </div>
      {isCreator && (
        <div className="flex flex-col items-center mt-4">
          <button
            onClick={() => socket.emit("destroyRoom", { roomId })}
            className="bg-red-600 hover:bg-red-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
          >
            Destruir Sala
          </button>
          <button
            onClick={() => {
              const roomLink = `${window.location.origin}/?roomId=${roomId}`;
              navigator.clipboard.writeText(roomLink);
              toast.success(
                "Link da sala copiado para a área de transferência!"
              );
            }}
            className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2 mb-4"
          >
            Copiar Link da Sala
          </button>
          <button
            onClick={() => {
              setWordGuessed(false);
              setShowConfetti(false);
              socket.emit(
                "createRoom",
                { word: customWord.toUpperCase(), username: user.username },
                (newRoomId) => {
                  setRoomId(newRoomId);
                  setIsCreator(true);
                }
              );
            }}
            className="bg-green-600 hover:bg-green-700 transition duration-200 text-white rounded px-4 py-2"
          >
            Iniciar Novo Jogo
          </button>
        </div>
      )}
    </motion.div>
  );
}
