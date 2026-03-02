import { NextResponse } from "next/server";
import crypto from "crypto";
import { savePasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  // Always return the same response to avoid leaking whether the email exists
  const successMessage = "If this email matches our records, a reset link has been sent.";

  if (email === adminEmail) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    savePasswordResetToken(token, expiresAt);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    await sendPasswordResetEmail(email, resetUrl);
  }

  return NextResponse.json({ message: successMessage });
}
