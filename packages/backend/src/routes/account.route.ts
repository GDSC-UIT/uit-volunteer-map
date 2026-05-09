import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createAccountSchema, updateAccountSchema } from '../schemas/account.js';
import { AccountService } from '../service/accountServices.js';
import { RoleEnum } from  '@uit-volunteer-map/shared';

const router = Router();
const accountService = new AccountService();

router.use(authenticateToken, requireRole([RoleEnum.ADMIN]));

// Get All
    router.get('/',
        async (_req, res) => {
        const accounts = await accountService.getAllAccounts();
        res.json(accounts);
    });

// Create Account (Leader only)
    router.post('/', validate(createAccountSchema), async (req, res) => {
        try {
            await accountService.createAccount(req.body);
            res.status(201).json({
                success: true,
                message: "Tạo tài khoản thành công"
            });
            } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            }
    });

// Update Account
    router.put('/:id', validate(updateAccountSchema), async (req, res) => {
        try {
            const updated = await accountService.updateAccount(Number(req.params.id), req.body);
            res.json({
                success: true,
                data: updated,
                message: "Cập nhật tài khoản thành công"
            });
        } catch (error: any) {
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    });

// Soft Delete Account
    router.delete('/:id', async (req, res) => {
        try {
            await accountService.softDeleteAccount(Number(req.params.id));
            
            // Đổi từ 204 sang 200 để có thể gửi trả Body JSON
            res.status(200).json({
                success: true,
                message: "Xóa tài khoản thành công"
            });
        } catch (error: any) {
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    });
// Get Account Info
    router.get('/:id', async (req, res) => {
        try {
            const accInfo = await accountService.getAccountInfo(Number(req.params.id));
            res.json(accInfo);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    })

export { router as accountRouter };