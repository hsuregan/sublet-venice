"use client";

import { useState } from "react";
import { eachDayOfInterval, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface PriceSummaryProps {
  selectedRange: DateRange;
  dailyRate: number;
  priceOverrides: { date: string; price: number }[];
}

export default function PriceSummary({
  selectedRange,
  dailyRate,
  priceOverrides,
}: PriceSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!selectedRange.from || !selectedRange.to) return null;

  const overrideMap = new Map(
    priceOverrides.map((o) => [o.date, o.price])
  );

  const stayDates = eachDayOfInterval({
    start: selectedRange.from,
    end: selectedRange.to,
  });

  if (stayDates.length === 0) return null;

  const breakdown = stayDates.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const price = overrideMap.get(dateStr) ?? dailyRate;
    return { date: dateStr, price };
  });

  const total = breakdown.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="bg-stone-100 rounded-lg p-4 border border-stone-200">
      <h3 className="font-semibold text-stone-800 mb-3">Price Summary</h3>
      <div className="border-t pt-2 flex justify-between font-semibold text-stone-800">
        <span>
          Total ({breakdown.length} night{breakdown.length !== 1 ? "s" : ""})
        </span>
        <span>${total.toFixed(2)}</span>
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm text-amber-700 hover:text-amber-800 flex items-center gap-1"
      >
        <span>{expanded ? "Hide" : "Show"} nightly breakdown</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-1 mt-3 pt-3 border-t">
          {breakdown.map((b) => (
            <div key={b.date} className="flex justify-between text-sm">
              <span className="text-stone-500">{b.date}</span>
              <span className="text-stone-800">${b.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
