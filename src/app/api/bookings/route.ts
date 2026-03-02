import { NextRequest, NextResponse } from "next/server";
import {
  createBooking,
  getSetting,
  getBlockedDates,
  getPriceOverrides,
} from "@/lib/db";
import { sendNewBookingNotification } from "@/lib/email";
import { eachDayOfInterval, format, parseISO, isBefore } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      introduction,
      referral,
    } = body;

    // Validate required fields
    if (
      !check_in ||
      !check_out ||
      !guest_name ||
      !guest_email ||
      !guest_phone ||
      !introduction
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const checkInDate = parseISO(check_in);
    const checkOutDate = parseISO(check_out);

    if (isBefore(checkOutDate, checkInDate)) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    // Check blocked dates
    const blockedDates = new Set(getBlockedDates().map((d) => d.date));
    const stayDates = eachDayOfInterval({
      start: checkInDate,
      end: checkOutDate,
    });

    for (const date of stayDates) {
      if (blockedDates.has(format(date, "yyyy-MM-dd"))) {
        return NextResponse.json(
          { error: "Some of the selected dates are not available" },
          { status: 400 }
        );
      }
    }

    // Calculate pricing
    const dailyRate = (getSetting("daily_rate") as number) || 150;
    const overrides = getPriceOverrides();
    const overrideMap = new Map(overrides.map((o) => [o.date, o.price]));

    const nightlyBreakdown: Record<string, number> = {};
    let totalPrice = 0;

    for (const date of stayDates) {
      const dateStr = format(date, "yyyy-MM-dd");
      const price = overrideMap.get(dateStr) ?? dailyRate;
      nightlyBreakdown[dateStr] = price;
      totalPrice += price;
    }

    const bookingId = createBooking({
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      introduction,
      referral,
      total_price: totalPrice,
      nightly_breakdown: nightlyBreakdown,
    });

    // Send email notification to admin
    await sendNewBookingNotification({
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      total_price: totalPrice,
      introduction,
    });

    return NextResponse.json(
      { id: bookingId, total_price: totalPrice, message: "Booking request submitted successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Booking creation error:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
