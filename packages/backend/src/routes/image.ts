import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js'; 
import { updateImageOrderSchema } from '../schemas/image.js';

import { AppDataSource } from '../db/data-source.js';
import { Photo } from '../entities/Photo.js';

const router = Router();

// 1. API for uploading images
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy file hợp lệ!' });
    }

    const photoRepo = AppDataSource.getRepository(Photo);

    const lastPhoto = await photoRepo.findOne({
      where: { isDeleted: 0 },
      order: { order: 'DESC' }
    });
    let currentOrder = lastPhoto ? lastPhoto.order + 1 : 0;

    const savedImages = [];
    
    for (const file of files) {
      const newPhoto = photoRepo.create({
        imageUrl: `/uploads/${file.filename}`,
        uploadedAt: new Date().toISOString(), 
        order: currentOrder++,             
        isDeleted: 0
      });
      const saved = await photoRepo.save(newPhoto);
      savedImages.push({
        id: saved.photoId,   
        url: saved.imageUrl,  
        order: saved.order    
      });
    }

    res.status(200).json({ message: 'Upload thành công', data: savedImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
  }
});

// 2. API for updating image order
router.put('/order', validate(updateImageOrderSchema), async (req, res) => {
  try {
    const newOrders = req.body;

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      for (const item of newOrders) {
        await transactionalEntityManager.update(Photo, { photoId: item.id }, { order: item.order });
      }
    });

    res.status(200).json({ message: 'Cập nhật thứ tự thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thứ tự' });
  }
});

export { router as imageRouter };