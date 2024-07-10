import { useState } from "react";
import Game from "../components/Game";
import TicTacToe from "../components/TicTacToe";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Escolha seu jogo</h1>
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setSelectedGame("hangman")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Forca
        </button>
        <button
          onClick={() => setSelectedGame("tictactoe")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Jogo da Velha
        </button>
      </div>

      {selectedGame === "hangman" && <Game />}
      {selectedGame === "tictactoe" && <TicTacToe />}
    </div>
  );
}
