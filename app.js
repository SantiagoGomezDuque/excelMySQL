require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const app = express();
app.use(express.static('views'));

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');
});

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'upload/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta para subir archivo
app.post('/upload', upload.single('excelFile'), (req, res) => {
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Insertar cada fila
  data.forEach(row => {
    const { nombre, correo, telefono } = row;
    db.query(
      'INSERT INTO contactos (nombre, correo, telefono) VALUES (?, ?, ?)',
      [nombre, correo, telefono],
      (err) => {
        if (err) console.error('Error al insertar fila:', err);
      }
    );
  });

  res.send('✅ Datos insertados correctamente en MySQL');
});

// Iniciar servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
