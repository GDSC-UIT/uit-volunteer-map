import { z } from 'zod';
import { RoleEnum } from  '@uit-volunteer-map/shared';

export const createAccountSchema = z.object({
    fullname: z.string().min(3),
    mssv: z.string().length(8, { message: "MSSV phải có đúng 8 ký tự" }),
    class: z.string().max(15, { message: "Mã lớp không được quá 15 ký tự" }),
    email: z.string()
        .email("Email không đúng định dạng")
        .refine((val) => val.endsWith("@gm.uit.edu.vn"), {
            message: "Chỉ chấp nhận email sinh viên UIT (@gm.uit.edu.vn)",
        }
        ),
    teamId: z.number(),
    phoneNumber: z.string().min(10, "Số điện thoại ít nhất 10 số"),
    username: z.string().min(3),
    password: z.string().min(6),
    
});
export const updateAccountSchema = z.object({
    password: z.string().min(6).optional(),
    roleId: z.nativeEnum(RoleEnum).optional(),
});