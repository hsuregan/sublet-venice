import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
  addBlockedDates,
  removeBlockedDatesByBookingId,
} from "@/lib/db";
import {
  sendBookingApproval,
  sendBookingDenial,
  sendBookingCancellation,
} from "@/lib/email";
import { eachDayOfInterval, format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const bookings = getBookings(status);

  return NextResponse.json({ bookings });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !["approved", "denied", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  updateBookingStatus(id, status);

  if (status === "approved") {
    // Block the dates
    const stayDates = eachDayOfInterval({
      start: parseISO(booking.check_in),
      end: parseISO(booking.check_out),
    });
    const dateStrings = stayDates.map((d) => format(d, "yyyy-MM-dd"));
    addBlockedDates(dateStrings, id);

    await sendBookingApproval({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      check_in: booking.check_in,
      check_out: booking.check_out,
      total_price: booking.total_price,
    });
  } else if (status === "denied") {
    // Remove any blocked dates for this booking (in case it was previously approved)
    removeBlockedDatesByBookingId(id);

    await sendBookingDenial({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      check_in: booking.check_in,
      check_out: booking.check_out,
    });
  } else if (status === "cancelled") {
    removeBlockedDatesByBookingId(id);

    await sendBookingCancellation({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      check_in: booking.check_in,
      check_out: booking.check_out,
    });
  }

  return NextResponse.json({ success: true });
}
