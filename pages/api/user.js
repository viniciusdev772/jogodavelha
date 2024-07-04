import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), "users.json");

export default function handler(req, res) {
  if (req.method === "GET") {
    const { username } = req.query;

    // Verifique se o arquivo de usuários existe
    if (fs.existsSync(usersFilePath)) {
      const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));

      // Verifique se o usuário existe
      if (usersData[username]) {
        const { level, xp } = usersData[username];
        res.status(200).json({ level, xp });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } else {
      res.status(500).json({ error: "Users data file not found" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
