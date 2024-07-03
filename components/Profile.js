export default function Profile({ user }) {
  if (!user) return null;

  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold">Perfil</h2>
      <p>Usuário: {user.username}</p>
      <p>Nível: {user.level}</p>
      <p>XP: {user.xp}</p>
    </div>
  );
}
