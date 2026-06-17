import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

import { isLikelyActiveJwt } from "@/lib/jwt-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token && isLikelyActiveJwt(token)) {
    redirect("/admin/dashboard");
  }

  redirect("/login");
}
