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

  db.run(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stick_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      x REAL,
      y REAL
    )
  `);
  db.run("ALTER TABLE stick_notes ADD COLUMN x REAL", () => {});
  db.run("ALTER TABLE stick_notes ADD COLUMN y REAL", () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player TEXT NOT NULL,
      score INTEGER NOT NULL,
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


app.get("/api/letters", (_req, res) => {
  db.all(
    "SELECT id, author, message, created_at AS createdAt FROM letters ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch letters" });
      }
      res.json(rows);
    }
  );
});

app.post("/api/letters", (req, res) => {
  const author = String(req.body.author || "").trim();
  const message = String(req.body.message || "").trim();

  if (!author || !message) {
    return res.status(400).json({ error: "Author and message are required" });
  }

  const createdAt = new Date().toLocaleString("en-US");
  db.run(
    "INSERT INTO letters(author, message, created_at) VALUES(?, ?, ?)",
    [author, message, createdAt],
    function onInsert(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save letter" });
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

app.delete("/api/letters/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid letter id" });
  }

  db.run("DELETE FROM letters WHERE id = ?", [id], function onDelete(err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete letter" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Letter not found" });
    }
    return res.status(204).end();
  });
});


app.get("/api/stick-notes", (_req, res) => {
  db.all(
    "SELECT id, author, message, created_at AS createdAt, x, y FROM stick_notes ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch stick notes" });
      }
      res.json(rows);
    }
  );
});

app.post("/api/stick-notes", (req, res) => {
  const author = String(req.body.author || "").trim();
  const message = String(req.body.message || "").trim();

  if (!author || !message) {
    return res.status(400).json({ error: "Author and message are required" });
  }

  const createdAt = new Date().toLocaleString("en-US");
  db.run(
    "INSERT INTO stick_notes(author, message, created_at, x, y) VALUES(?, ?, ?, NULL, NULL)",
    [author, message, createdAt],
    function onInsert(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save stick note" });
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

app.patch("/api/stick-notes/:id/position", (req, res) => {
  const id = Number(req.params.id);
  const x = Number(req.body.x);
  const y = Number(req.body.y);

  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
    return res.status(400).json({ error: "Invalid stick note position payload" });
  }

  db.run("UPDATE stick_notes SET x = ?, y = ? WHERE id = ?", [x, y, id], function onUpdate(err) {
    if (err) {
      return res.status(500).json({ error: "Failed to update stick note position" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Stick note not found" });
    }
    return res.status(204).end();
  });
});

app.delete("/api/stick-notes/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid stick note id" });
  }

  db.run("DELETE FROM stick_notes WHERE id = ?", [id], function onDelete(err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete stick note" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Stick note not found" });
    }
    return res.status(204).end();
  });
});


app.get("/api/game-scores/top", (_req, res) => {
  db.all(
    "SELECT player, MAX(score) AS bestScore FROM game_scores GROUP BY player ORDER BY bestScore DESC, player ASC LIMIT 10",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch top scores" });
      }
      res.json(rows);
    }
  );
});

app.get("/api/game-scores/recent", (_req, res) => {
  db.all(
    "SELECT player, score, created_at AS createdAt FROM game_scores ORDER BY id DESC LIMIT 20",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch recent scores" });
      }
      res.json(rows);
    }
  );
});

app.post("/api/game-scores", (req, res) => {
  const player = String(req.body.player || "").trim();
  const score = Number(req.body.score);

  if (!player || !Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: "Valid player and score are required" });
  }

  const createdAt = new Date().toLocaleString("en-US");
  db.run(
    "INSERT INTO game_scores(player, score, created_at) VALUES(?, ?, ?)",
    [player, score, createdAt],
    function onInsert(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save game score" });
      }
      return res.status(201).json({ id: this.lastID, player, score, createdAt });
    }
  );
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
