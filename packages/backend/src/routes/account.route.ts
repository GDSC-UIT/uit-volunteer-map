import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createAccountSchema, updateAccountSchema } from '../schemas/account.js';
import { readId } from '../schemas/read.js';
import { AccountService } from '../service/accountServices.js';
import { RoleEnum, ERROR_MESSAGES } from '@uit-volunteer-map/shared';
import { HttpError } from '../errors/HttpError.js';

const router = Router(), service = new AccountService();
router.use(authenticateToken,requireRole([RoleEnum.ADMIN]));
const handle = (work:(req:Request)=>Promise<unknown>,status=200) => async (req:Request,res:Response) => {
  try {res.status(status).json({success:true,data:await work(req)});}
  catch (error:unknown) {res.status(error instanceof HttpError ? error.statusCode : 500)
    .json({success:false,error:error instanceof HttpError ? error.message : ERROR_MESSAGES.INTERNAL_SERVER_ERROR});}
};
router.get('/',handle(()=>service.getAllAccounts()));
router.get('/:id',handle(req=>service.getAccountInfo(readId(req.params.id,'account'))));
router.post('/',validate(createAccountSchema),handle(req=>service.createAccount(req.body),201));
router.put('/:id',validate(updateAccountSchema),handle(req=>service.updateAccount(readId(req.params.id,'account'),req.body)));
// Deactivate and release assignments; never physically delete identity/history.
router.delete('/:id',handle(req=>service.softDeleteAccount(readId(req.params.id,'account'))));
export {router as accountRouter};
