import { z } from 'zod';

const fullname = z.string().trim().min(3).max(200);
const mssv = z.string().trim().length(8, 'MSSV phải có đúng 8 ký tự');
const className = z.string().trim().max(15, 'Mã lớp không được quá 15 ký tự');
const email = z.string().trim().toLowerCase().email('Email không đúng định dạng')
  .refine(value => value.endsWith('@gm.uit.edu.vn'), 'Chỉ chấp nhận email sinh viên UIT (@gm.uit.edu.vn)');
const phoneNumber = z.string().trim().min(10, 'Số điện thoại ít nhất 10 ký tự').max(30);
const password = z.string().min(6, 'Mật khẩu ít nhất 6 ký tự')
  .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu không được vượt quá 72 byte');

// Assignment is performed separately through the R07 team lifecycle API.
export const createAccountSchema = z.object({
  username: z.string().trim().min(3).max(100), password, fullname, mssv,
  class: className, email, phoneNumber,
}).strict();
export const updateAccountSchema = z.object({
  password: password.optional(), fullname: fullname.optional(), email: email.optional(),
  mssv: mssv.nullable().optional(), class: className.nullable().optional(),
  phoneNumber: phoneNumber.nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Không có thay đổi để lưu');
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
