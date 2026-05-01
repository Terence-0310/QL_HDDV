import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100, "Họ tên tối đa 100 ký tự"),
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmPassword: z.string().min(8, "Mật khẩu xác nhận không hợp lệ"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận không khớp",
      });
    }
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
