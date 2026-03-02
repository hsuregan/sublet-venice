"use client";

import { useState, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { isBefore, startOfDay, parseISO, isWithinInterval } from "date-fns";

interface AvailabilityData {
  blockedDates: string[];
  availableDateRanges: { from: string; to: string }[];
  dailyRate: number;
  priceOverrides: { date: string; price: number }[];
}

interface BookingCalendarProps {
  availability: AvailabilityData;
  selectedRange: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
}

export default function BookingCalendar({
  availability,
  selectedRange,
  onRangeChange,
}: BookingCalendarProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const today = startOfDay(new Date());
  const blockedSet = new Set(availability.blockedDates);

  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, today)) return true;

    const dateStr = date.toISOString().split("T")[0];
    if (blockedSet.has(dateStr)) return true;

    // Only allow dates within available ranges (no ranges = nothing bookable)
    if (availability.availableDateRanges.length === 0) return true;
    const inRange = availability.availableDateRanges.some((range) => {
      const from = parseISO(range.from);
      const to = parseISO(range.to);
      return isWithinInterval(date, { start: from, end: to });
    });
    if (!inRange) return true;

    return false;
  };

  return (
    <div className="flex justify-center">
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={onRangeChange}
        disabled={isDateDisabled}
        numberOfMonths={isMobile ? 1 : 2}
        showOutsideDays={false}
        className="!font-sans"
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center text-stone-800",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button:
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
          nav_button_previous: "!absolute left-1 top-1/2 -translate-y-1/2",
          nav_button_next: "!absolute right-1 top-1/2 -translate-y-1/2",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-stone-500 rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 hover:bg-stone-200 rounded-full inline-flex items-center justify-center",
          day_selected:
            "!bg-amber-700 !text-white hover:!bg-amber-800 focus:!bg-amber-800",
          day_today: "bg-stone-200 font-semibold",
          day_outside: "text-stone-400 opacity-50",
          day_disabled: "text-stone-300 opacity-50 cursor-not-allowed",
          day_range_middle:
            "!bg-amber-100 !text-amber-900",
          day_range_start: "!bg-amber-700 !text-white rounded-full",
          day_range_end: "!bg-amber-700 !text-white rounded-full",
          day_hidden: "invisible",
        }}
      />
    </div>
  );
}
