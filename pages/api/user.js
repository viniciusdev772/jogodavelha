import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "users.json");

export default function handler(req, res) {
  if (req.method === "GET") {
    const { username } = req.query;

    // Verifique se o arquivo de usuários existe
    if (fs.existsSync(usersFilePath)) {
      const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));

      if (username) {
        // Verifique se o usuário existe
        if (usersData[username]) {
          const { level, xp } = usersData[username];
          res.status(200).json({ level, xp });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } else {
        // Se nenhum nome de usuário for fornecido, retornar todos os usuários
        const usersArray = Object.keys(usersData).map((username) => ({
          username,
          level: usersData[username].level,
          xp: usersData[username].xp,
        }));

        // Ordenar os usuários por nível e XP
        usersArray.sort((a, b) => {
          if (b.level === a.level) {
            return b.xp - a.xp;
          }
          return b.level - a.level;
        });

        res.status(200).json(usersArray);
      }
    } else {
      res.status(500).json({ error: "Users data file not found" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
