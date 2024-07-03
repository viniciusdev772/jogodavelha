import { useState } from "react";

export default function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      <input
        type="text"
        placeholder="Nome de Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-400 rounded px-4 py-2 mb-4 text-black bg-white"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white rounded px-4 py-2"
      >
        Registrar
      </button>
    </form>
  );
}
