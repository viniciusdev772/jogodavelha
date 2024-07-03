import ProgressBar from "@ramonak/react-progress-bar";

export default function Profile({ user }) {
  if (!user) return null;

  // Calculate the percentage of XP for the current level
  const xpPercentage = (user.xp / (user.level * 10)) * 100;

  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold">Perfil</h2>
      <p>Usuário: {user.username}</p>
      <p>Nível: {user.level}</p>
      <div className="mb-2">XP:</div>
      <ProgressBar completed={xpPercentage} />
      <p>
        {user.xp} / {user.level * 10} XP
      </p>
    </div>
  );
}
