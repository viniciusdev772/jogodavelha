import { useEffect, useState } from "react";
import ProgressBar from "@ramonak/react-progress-bar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch("/api/user");
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        toast.error(data.error);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="text-center text-2xl">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
      <ToastContainer />
      <h1 className="text-4xl font-bold mb-8">Usuários</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-black rounded-lg shadow-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Usuário</th>
              <th className="px-4 py-2 border-b">Nível</th>
              <th className="px-4 py-2 border-b">XP</th>
              <th className="px-4 py-2 border-b">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.username}
                className="hover:bg-gray-200 transition-colors"
              >
                <td className="px-4 py-2 border-b text-center">
                  {user.username}
                </td>
                <td className="px-4 py-2 border-b text-center">{user.level}</td>
                <td className="px-4 py-2 border-b text-center">{user.xp}</td>
                <td className="px-4 py-2 border-b text-center">
                  <ProgressBar
                    completed={(user.xp / (user.level * 10)) * 100}
                    labelColor="#000000"
                    bgColor="#6a1b9a"
                    height="20px"
                    className="rounded-full"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
