require('dotenv').config(); // Carga archivo .env
const express = require('express'); //  Express para crear el servidor web
const multer = require('multer'); // Importa Multer para manejar la subida de archivos
const mysql = require('mysql2'); // Importa el cliente de MySQL para conectarse a bases de datos
const path = require('path'); // Módulo para manejar rutas de archivos
const fs = require('fs'); // Módulo para trabajar con archivos del sistema
const xlsx = require('xlsx'); // Librería para leer archivos de Excel
const app = express(); // Crea la app Express
app.use(express.static('views')); // Sirve archivos estáticos desde la carpeta 'views'

// Conexión a MySQL usando datos de .env
const db = mysql.createConnection({
  host: process.env.DB_HOST,       // Host de la base de datos
  user: process.env.DB_USER,       // Usuario de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña del usuario
  database: process.env.DB_NAME,     // Nombre de la base de datos
});

// Intenta conectar a la base de datos
db.connect(err => {
  if (err) throw err;                    // Si hay error, se muestra esto
  console.log('Conectado a MySQL');     // Si la conexión es exitosa se muestra esto
});

// Configuración de almacenamiento con Multer
const storage = multer.diskStorage({
  // Define la carpeta para guardar los archivos
  destination: (req, file, cb) => cb(null, 'upload/'),

  // Define el nombre del archivo subido (con timestamp)
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Crea la instancia de Multer con la configuración
const upload = multer({ storage });

// Ruta principal - Muestra el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); // Envia el archivo index.html ubicado en la carpeta 'views'
});

// Ruta POST para subir el archivo Excel
app.post('/upload', upload.single('excelFile'), (req, res) => {
  const filePath = req.file.path; // Ruta del archivo subido

  // Lee el archivo Excel
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];  // Obtiene el nombre de la primera hoja
  const sheet = workbook.Sheets[sheetName]; // Obtiene la hoja por su nombre
  const data = xlsx.utils.sheet_to_json(sheet);  // Convierte la hoja en un arreglo de objetos JavaScript

  // Recorre cada fila del archivo Excel
  data.forEach(row => {
    const { nombre, correo, telefono } = row;  // Extrae los campos de cada fila (contactos en este caso)

    // Inserta los datos en la tabla 'contactos' de MySQL
    db.query(
      'INSERT INTO contactos (nombre, correo, telefono) VALUES (?, ?, ?)', 
      [nombre, correo, telefono],
      (err) => {
        if (err) console.error('Error al insertar fila:', err); // Muestra error si ocurre
      }
    );
  });

  res.send('✅ Datos insertados correctamente en MySQL');  // Mensaje si la inserción de los datos es correcta
});

// Inicia el servidor Express
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`); // Muestra un mensaje indicando que el servidor está corriendo
});