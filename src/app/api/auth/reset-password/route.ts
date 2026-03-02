import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getPasswordResetToken,
  clearPasswordResetToken,
  saveAdminPasswordHash,
} from "@/lib/db";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 }
    );
  }

  const stored = getPasswordResetToken();

  if (!stored || stored.token !== token) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  if (new Date(stored.expiresAt) < new Date()) {
    clearPasswordResetToken();
    return NextResponse.json(
      { error: "Reset token has expired" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  saveAdminPasswordHash(hash);
  clearPasswordResetToken();

  return NextResponse.json({ message: "Password has been reset successfully" });
}
