"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parseISO, isWithinInterval } from "date-fns";

interface PriceOverride {
  id: number;
  date: string;
  price: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface AdminCalendarProps {
  dailyRate: number;
  overrides: PriceOverride[];
  blockedDates: string[];
  availableRanges: DateRange[];
  onOverrideChange: (date: string, price: number) => Promise<void>;
  onOverrideRemove: (id: number) => Promise<void>;
}

export default function AdminCalendar({
  dailyRate,
  overrides,
  blockedDates,
  availableRanges,
  onOverrideChange,
  onOverrideRemove,
}: AdminCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const blockedSet = new Set(blockedDates);
  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  function isDateAvailable(dateStr: string): boolean {
    if (availableRanges.length === 0) return false;
    const date = parseISO(dateStr);
    return availableRanges.some((range) =>
      isWithinInterval(date, { start: parseISO(range.from), end: parseISO(range.to) })
    );
  }

  function getPriceForDate(dateStr: string): number {
    const override = overrideMap.get(dateStr);
    return override ? override.price : dailyRate;
  }

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    const dateStr = format(day, "yyyy-MM-dd");
    setEditPrice(String(getPriceForDate(dateStr)));
  }

  async function handleSetPrice() {
    if (!selectedDate || !editPrice) return;
    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    await onOverrideChange(dateStr, parseFloat(editPrice));
    setSaving(false);
  }

  async function handleResetToDefault() {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const override = overrideMap.get(dateStr);
    if (!override) return;
    setSaving(true);
    await onOverrideRemove(override.id);
    setEditPrice(String(dailyRate));
    setSaving(false);
  }

  const selectedDateStr = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;
  const selectedOverride = selectedDateStr
    ? overrideMap.get(selectedDateStr)
    : null;
  const isSelectedBooked = selectedDateStr
    ? blockedSet.has(selectedDateStr)
    : false;
  const isSelectedUnavailable = selectedDateStr
    ? !isDateAvailable(selectedDateStr)
    : false;

  function DayContent(props: { date: Date; displayMonth: Date }) {
    const dateStr = format(props.date, "yyyy-MM-dd");
    const isBooked = blockedSet.has(dateStr);
    const available = isDateAvailable(dateStr);
    const price = getPriceForDate(dateStr);

    return (
      <div className="flex flex-col items-center justify-center leading-tight">
        <span className="text-xs">{props.date.getDate()}</span>
        {isBooked ? (
          <span className="text-[9px] font-medium">Booked</span>
        ) : !available ? (
          <span className="text-[9px] text-gray-400">N/A</span>
        ) : (
          <span className="text-[9px] text-gray-500">&euro;{price}</span>
        )}
      </div>
    );
  }

  const bookedDays: Date[] = [];
  const overrideDays: Date[] = [];
  const unavailableMatcher = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !isDateAvailable(dateStr) && !blockedSet.has(dateStr);
  };
  blockedDates.forEach((d) => bookedDays.push(new Date(d + "T00:00:00")));
  overrides.forEach((o) => {
    if (!blockedSet.has(o.date)) {
      overrideDays.push(new Date(o.date + "T00:00:00"));
    }
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Pricing Calendar
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Click a date to set a custom price. Booked dates are shown in red.
      </p>

      <div className="flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(day) => day && handleDayClick(day)}
          numberOfMonths={3}
          showOutsideDays
          className="!font-sans"
          modifiers={{
            booked: bookedDays,
            override: overrideDays,
            unavailable: unavailableMatcher,
          }}
          modifiersClassNames={{
            booked: "!bg-red-100 !text-red-800",
            override: "!bg-blue-50 !text-blue-900",
            unavailable: "!opacity-40",
          }}
          components={{
            DayContent,
          }}
          classNames={{
            months: "flex flex-wrap justify-center gap-6",
            month: "space-y-4",
            caption:
              "flex justify-center pt-1 relative items-center text-gray-900",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-gray-500 rounded-md w-10 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-12 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md inline-flex items-center justify-center cursor-pointer",
            day_selected:
              "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
            day_today: "border-2 border-blue-400 font-semibold",
            day_outside: "text-gray-400 opacity-50",
            day_hidden: "invisible",
          }}
        />
      </div>

      {selectedDate && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Selected Date
              </label>
              <p className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-900 font-medium">
                {format(selectedDate, "MMM d, yyyy")}
              </p>
            </div>
            {isSelectedBooked ? (
              <p className="text-sm text-red-600 font-medium py-2">
                This date is booked and cannot have its price changed.
              </p>
            ) : isSelectedUnavailable ? (
              <p className="text-sm text-gray-500 font-medium py-2">
                This date is outside the bookable date ranges.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Price (&euro;)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    min="0"
                    step="1"
                  />
                </div>
                <button
                  onClick={handleSetPrice}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Set Price"}
                </button>
                {selectedOverride && (
                  <button
                    onClick={handleResetToDefault}
                    disabled={saving}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Reset to Default
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
