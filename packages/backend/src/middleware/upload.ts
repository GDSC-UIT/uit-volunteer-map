import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (_req, _file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, _file.fieldname + '-' + uniqueSuffix + path.extname(_file.originalname));
  }
});

const fileFilter = (_req: Express.Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimeTypes.includes(_file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)!')); 
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter,
});