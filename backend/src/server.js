require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* =========================
   MYSQL CONFIG (Usando .env)
========================= */
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "-29032005-Lu",
  database: process.env.DB_NAME || "todo_app",
  waitForConnections: true,
  connectionLimit: 10,
});

// Probar conexión al iniciar
db.getConnection()
  .then(() => console.log(" Conectado a MySQL con éxito"))
  .catch(err => console.error(" Error de conexión:", err.message));

/* =========================
   CRUD TODOS
========================= */

// LISTAR TAREAS
app.get("/api/todos", async (req, res) => {
  try {
    const { status } = req.query;
    let sql = "SELECT * FROM todos";
    const params = [];

    if (status === "active") {
      sql += " WHERE completed = 0";
    } else if (status === "completed") {
      sql += " WHERE completed = 1";
    }
    
    sql += " ORDER BY id DESC"; // Ordenamos por las más nuevas primero

    const [rows] = await db.query(sql);
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// CREAR TAREA
app.post("/api/todos", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Título requerido" });

    const [result] = await db.query(
      "INSERT INTO todos (title, completed) VALUES (?, 0)",
      [title.trim()]
    );

    res.status(201).json({ data: { id: result.insertId, title, completed: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACTUALIZAR TAREA (Check/Uncheck)
app.patch("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    await db.query(
      "UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?",
      [title, completed, id]
    );

    res.json({ data: "Actualizado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// CLEAR COMPLETED
app.delete("/api/todos/clear/completed", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM todos WHERE completed = 1");
    res.json({ data: `${result.affectedRows} eliminados`, error: null });
  } catch (err) {
    res.status(500).json({ error: "No se pudo limpiar la base de datos" });
  }
});
// ELIMINAR TAREA
app.delete("/api/todos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM todos WHERE id = ?", [req.params.id]);
    res.json({ data: "Eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(` API corriendo en http://localhost:${PORT}`);
});

// MARK ALL DONE
app.put('/api/todos/mark-all', async (req, res) => {
  try {
    await db.query(
      'UPDATE todos SET completed = 1'
    );
    res.json({ message: 'Todas las tareas marcadas como completadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en mark-all' });
  }
});

