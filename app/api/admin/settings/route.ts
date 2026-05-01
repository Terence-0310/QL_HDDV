import { NextResponse, NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "settings.json");

const defaultSettings = {
  companyName: "Công ty TNHH Giải pháp Phần mềm ABC",
  taxCode: "0312345678",
  email: "contact@abcsoftware.vn",
  phone: "028 7300 1234",
  address: "Tòa nhà ABC, 123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM",
  r30: true,
  r15: true,
  r7: true,
  r0: true,
  retryPolicy: "1",
  strongPassword: true,
  require2FA: false,
  sessionTimeout: "3",
  smtpHost: "smtp.sendgrid.net",
  smtpPort: "587"
};

async function getSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // If file doesn't exist, create it with default settings
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2), "utf8");
      return defaultSettings;
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Error reading settings:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const currentSettings = await getSettings();
    
    // Merge updates
    const updatedSettings = { ...currentSettings, ...body };
    
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(updatedSettings, null, 2), "utf8");
    
    return NextResponse.json({ success: true, message: "Settings updated successfully", data: updatedSettings });
  } catch (error: any) {
    console.error("Error writing settings:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
