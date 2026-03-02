import { NextResponse } from "next/server";
import {
  getSetting,
  getBlockedDates,
  getPriceOverrides,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const dailyRate = getSetting("daily_rate") as number;
  const availableDateRanges = getSetting("available_date_ranges") as
    | { from: string; to: string }[]
    | null;
  const blockedDates = getBlockedDates().map((d) => d.date);
  const priceOverrides = getPriceOverrides();

  return NextResponse.json({
    dailyRate,
    availableDateRanges: availableDateRanges || [],
    blockedDates,
    priceOverrides: priceOverrides.map((o) => ({
      date: o.date,
      price: o.price,
    })),
  });
}
