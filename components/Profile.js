import ProgressBar from "@ramonak/react-progress-bar";

export default function Profile({ user }) {
  if (!user) return null;

  const xp = user.xp || 0;
  const level = user.level || 1;
  const xpPercentage = ((xp / (level * 10)) * 100).toFixed(2);

  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold">Perfil</h2>
      <p>Usuário: {user.username}</p>
      <p>Nível: {level}</p>
      <div className="mb-2">XP:</div>
      <ProgressBar completed={xpPercentage} />
      <p>
        {xp} / {level * 10} XP
      </p>
    </div>
  );
}
