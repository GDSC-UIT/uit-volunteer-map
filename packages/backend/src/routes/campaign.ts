import { Router } from 'express';
import { CampaignService } from '../service/campaign.service.js';
import { validate } from '../middleware/validate.js';
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { RoleEnum } from '@uit-volunteer-map/shared';

const router = Router();
const campaignService = new CampaignService();

// --- BẢO MẬT ---
// Dòng này nghĩa là: Phải đăng nhập & là ADMIN/LEADER mới được dùng
router.use(authenticateToken, requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]));

// 1. GET ALL (Xem tất cả)
router.get('/', async (_req, res) => {
  try {
    const data = await campaignService.getAll();
    res.json({ success: true, data });
  } catch (e) { 
    res.status(500).json({ success: false, message: "Lỗi Server" }); 
  }
});

// 2. GET ONE (Xem chi tiết)
router.get('/:id', async (req, res) => {
  try {
    const data = await campaignService.getOne(Number(req.params.id));
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(404).json({ success: false, message: "Không tìm thấy" });
  }
});

// 3. POST (Tạo mới)
router.post('/', validate(createCampaignSchema), async (req, res) => {
  try {
    const data = await campaignService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    if (e.message === "CAMPAIGN_EXISTS") {
        return res.status(409).json({ success: false, message: "Tên chiến dịch đã tồn tại" });
    }
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// 4. PUT (Sửa)
router.put('/:id', validate(updateCampaignSchema), async (req, res) => {
  try {
    const data = await campaignService.update(Number(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(404).json({ success: false, message: "Không tìm thấy ID để sửa" });
  }
});

// 5. DELETE (Xóa)
router.delete('/:id', async (req, res) => {
  try {
    await campaignService.delete(Number(req.params.id));
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (e: any) {
    res.status(404).json({ success: false, message: "Không tìm thấy ID để xóa" });
  }
});

export { router as campaignRouter };