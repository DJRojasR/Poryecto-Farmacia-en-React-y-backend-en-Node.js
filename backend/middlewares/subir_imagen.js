import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const DIR_UPLOADS = path.resolve('uploads');
await fs.mkdir(DIR_UPLOADS, { recursive: true });

const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const errTipo = Object.assign(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), { esperado: true });

const leerArchivo = multer({
  storage: multer.memoryStorage(), // nada toca el disco hasta validarlo
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 15 },
  fileFilter: (_req, file, cb) => (TIPOS.has(file.mimetype) ? cb(null, true) : cb(errTipo)),
}).single('imagen');

export function subirImagen(req, res, next) {
  leerArchivo(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ mensaje: 'La imagen no puede pasar de 2 MB.' });
      if (err.esperado || err instanceof multer.MulterError) {
        return res.status(400).json({ mensaje: err.esperado ? err.message : 'Archivo no permitido.' });
      }
      return next(err);
    }
    if (!req.file) return next(); // imagen es opcional

    try {
      const nombre = `${crypto.randomUUID()}.webp`;
      await sharp(req.file.buffer, { limitInputPixels: 25_000_000 })
        .rotate() // respeta la orientación y luego descarta los metadatos
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(DIR_UPLOADS, nombre));
      req.imagenNueva = `/uploads/${nombre}`;
      next();
    } catch {
      res.status(400).json({ mensaje: 'El archivo no es una imagen válida.' });
    }
  });
}

// Para no dejar archivos huérfanos si luego falla la validación o la BD
export const borrarImagen = (ruta) =>
  ruta ? fs.unlink(path.join(DIR_UPLOADS, path.basename(ruta))).catch(() => {}) : undefined;