import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM || "bookings@yourdomain.com";

export async function sendNewBookingNotification(booking: {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_price: number;
  introduction: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `New Booking Request from ${booking.guest_name}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Guest:</strong> ${booking.guest_name}</p>
        <p><strong>Email:</strong> ${booking.guest_email}</p>
        <p><strong>Phone:</strong> ${booking.guest_phone}</p>
        <p><strong>Check-in:</strong> ${booking.check_in}</p>
        <p><strong>Check-out:</strong> ${booking.check_out}</p>
        <p><strong>Total:</strong> €${booking.total_price.toFixed(2)}</p>
        <p><strong>Introduction:</strong> ${booking.introduction}</p>
        <br/>
        <p>Log in to the admin panel to approve or deny this request.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send new booking email:", err);
  }
}

export async function sendBookingApproval(booking: {
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
}) {
  try {
    await resend.emails.send({
      from,
      to: booking.guest_email,
      subject: "Your Venice Booking is Confirmed!",
      html: `
        <h2>Booking Confirmed</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>Great news! Your booking has been approved.</p>
        <p><strong>Check-in:</strong> ${booking.check_in}</p>
        <p><strong>Check-out:</strong> ${booking.check_out}</p>
        <p><strong>Total:</strong> €${booking.total_price.toFixed(2)}</p>
        <br/>
        <p>We will follow up with check-in instructions closer to your arrival date.</p>
        <p>Thank you for choosing to stay with us in Venice!</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send approval email:", err);
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your admin account.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
}

export async function sendBookingCancellation(booking: {
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
}) {
  try {
    await resend.emails.send({
      from,
      to: booking.guest_email,
      subject: "Your Venice Booking Has Been Cancelled",
      html: `
        <h2>Booking Cancelled</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>We regret to inform you that your booking for ${booking.check_in} to ${booking.check_out} has been cancelled.</p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>We hope to welcome you in the future!</p>
        <p>Best regards</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
  }
}

export async function sendBookingDenial(booking: {
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
}) {
  try {
    await resend.emails.send({
      from,
      to: booking.guest_email,
      subject: "Update on Your Venice Booking Request",
      html: `
        <h2>Booking Update</h2>
        <p>Dear ${booking.guest_name},</p>
        <p>Thank you for your interest in our Venice apartment. Unfortunately, the dates you requested (${booking.check_in} to ${booking.check_out}) are not available.</p>
        <p>Please feel free to check our calendar for other available dates. We'd love to host you!</p>
        <p>Best regards</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send denial email:", err);
  }
}
