import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://jogo.viniciusdev.com.br", {
  transports: ["websocket"],
});

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [player, setPlayer] = useState("X");

  useEffect(() => {
    socket.on("playerMove", ({ board, isXNext }) => {
      setBoard(board);
      setIsXNext(isXNext);
    });

    socket.on("gameOver", (winner) => {
      setWinner(winner);
    });

    return () => {
      socket.off("playerMove");
      socket.off("gameOver");
    };
  }, []);

  const handleClick = (index) => {
    if (!winner && !board[index]) {
      const newBoard = board.slice();
      newBoard[index] = isXNext ? "X" : "O";
      setBoard(newBoard);
      setIsXNext(!isXNext);

      socket.emit("playerMove", {
        board: newBoard,
        isXNext: !isXNext,
        roomId,
      });

      const winner = calculateWinner(newBoard);
      if (winner) {
        setWinner(winner);
        socket.emit("gameOver", { winner, roomId });
      }
    }
  };

  const calculateWinner = (board) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  return (
    <div>
      <h2>Jogo da Velha</h2>
      <div className="board">
        {board.map((value, index) => (
          <div
            key={index}
            className="square"
            onClick={() => handleClick(index)}
          >
            {value}
          </div>
        ))}
      </div>
      {winner && <h3>Vencedor: {winner}</h3>}
    </div>
  );
}
