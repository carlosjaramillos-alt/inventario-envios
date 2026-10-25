import multer from 'multer';
import path from 'path';

// Configuración del lugar donde se guardarán las fotos subidas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Los archivos se guardarán en la carpeta 'uploads'
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único usando la fecha actual y la extensión original (.png, .jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware de Multer listo para usar en las rutas
export const upload = multer({ storage });