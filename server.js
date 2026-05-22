const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "loveboard.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
});

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/messages", (_req, res) => {
  db.all(
    "SELECT id, author, message, created_at AS createdAt FROM messages ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch messages" });
      }
      res.json(rows);
    }
  );
});

app.post("/api/messages", (req, res) => {
  const author = String(req.body.author || "").trim();
  const message = String(req.body.message || "").trim();

  if (!author || !message) {
    return res.status(400).json({ error: "Author and message are required" });
  }

  const createdAt = new Date().toLocaleString("en-US");
  db.run(
    "INSERT INTO messages(author, message, created_at) VALUES(?, ?, ?)",
    [author, message, createdAt],
    function onInsert(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save message" });
      }
      return res.status(201).json({
        id: this.lastID,
        author,
        message,
        createdAt
      });
    }
  );
});

app.delete("/api/messages/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  db.run("DELETE FROM messages WHERE id = ?", [id], function onDelete(err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete message" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    return res.status(204).end();
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
