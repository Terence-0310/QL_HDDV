import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { signResetPasswordToken } from "@/lib/jwt";
import { sendMailWithProvider } from "@/lib/mail/provider";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "auth:forgot-password", { limit: 5, windowMs: 15 * 60 * 1000 }); // 5 reqs per 15 mins

    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Để bảo mật, không tiết lộ email có tồn tại hay không.
      return successResponse("Nếu email hợp lệ, bạn sẽ nhận được một hướng dẫn khôi phục mật khẩu.");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Tài khoản của bạn đã bị khóa hoặc không hoạt động.", 403, "FORBIDDEN");
    }

    const token = signResetPasswordToken(user.id, user.passwordHash);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resetUrl = `${appUrl}/reset-password?token=${token}&id=${user.id}`;

    const htmlContent = `
      <h2>Khôi phục mật khẩu</h2>
      <p>Xin chào ${user.name},</p>
      <p>Bạn đã yêu cầu khôi phục mật khẩu tại hệ thống Quản lý hợp đồng điện tử.</p>
      <p>Vui lòng click vào đường dẫn bên dưới để đặt lại mật khẩu của bạn. Đường dẫn này sẽ hết hạn trong 15 phút.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#0070f3;color:#fff;text-decoration:none;border-radius:5px;">Đặt lại mật khẩu</a>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    const mailResult = await sendMailWithProvider({
      to: user.email,
      subject: "Yêu cầu khôi phục mật khẩu",
      html: htmlContent,
      text: `Link khôi phục mật khẩu của bạn: ${resetUrl}`,
    });

    if (!mailResult.success) {
      throw new AppError("Không thể gửi email lúc này. Vui lòng thử lại sau.", 500, "MAIL_ERROR");
    }

    return successResponse("Nếu email hợp lệ, bạn sẽ nhận được một hướng dẫn khôi phục mật khẩu.");
  } catch (error) {
    return handleRouteError(error);
  }
}
