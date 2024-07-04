import React, { useEffect, useState } from "react";
import ProgressBar from "@ramonak/react-progress-bar";

const Profile = ({ username }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch(`/api/user?username=${username}`);
      const data = await response.json();
      if (response.ok) {
        setUserData(data);
      } else {
        console.error(data.error);
      }
    };

    fetchUserData();
  }, [username]);

  if (!userData) return <div>Loading...</div>;

  const { level, xp } = userData;
  const xpPercentage = ((xp / (level * 10)) * 100).toFixed(2);

  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold">Perfil</h2>
      <p>Usuário: {username}</p>
      <p>Nível: {level}</p>
      <div className="mb-2">XP:</div>
      <ProgressBar completed={xpPercentage} />
      <p>
        {xp} / {level * 10} XP
      </p>
    </div>
  );
};

export default Profile;
