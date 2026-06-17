import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { verifyResetPasswordToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const schema = z.object({
  id: z.string().min(1, "Thiếu ID người dùng"),
  token: z.string().min(1, "Thiếu Token khôi phục"),
  newPassword: z.string().min(8, "Mật khẩu phải dài ít nhất 8 ký tự"),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "auth:reset-password", { limit: 5, windowMs: 15 * 60 * 1000 });

    const body = await request.json();
    const { id, token, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Người dùng không hợp lệ hoặc tài khoản đã bị khóa", 400, "INVALID_USER");
    }

    // Xác thực token sử dụng hash cũ. Nếu đúng, token sẽ trả về id.
    const decoded = verifyResetPasswordToken(token, user.passwordHash);
    
    if (decoded.id !== user.id) {
      throw new AppError("Token không thuộc về tài khoản này", 400, "INVALID_TOKEN");
    }

    // Mã hóa mật khẩu mới
    const newPasswordHash = await hashPassword(newPassword);

    // Cập nhật Database (làm thay đổi hash, khiến link reset cũ ngay lập tức hết hạn)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return successResponse("Cập nhật mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
  } catch (error) {
    return handleRouteError(error);
  }
}
