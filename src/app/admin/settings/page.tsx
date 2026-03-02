"use client";

import { useEffect, useState } from "react";
import AdminCalendar from "@/components/AdminCalendar";

interface PriceOverride {
  id: number;
  date: string;
  price: number;
}

interface DateRange {
  from: string;
  to: string;
}

export default function AdminSettingsPage() {
  const [dailyRate, setDailyRate] = useState<number>(150);
  const [overrides, setOverrides] = useState<PriceOverride[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [availableRanges, setAvailableRanges] = useState<DateRange[]>([]);
  const [newRangeFrom, setNewRangeFrom] = useState("");
  const [newRangeTo, setNewRangeTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [rangeMessage, setRangeMessage] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchOverrides();
    fetchBlockedDates();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setDailyRate(data.settings.daily_rate || 150);
      setAvailableRanges(data.settings.available_date_ranges || []);
    }
  }

  async function fetchOverrides() {
    const res = await fetch("/api/admin/price-overrides");
    if (res.ok) {
      const data = await res.json();
      setOverrides(data.overrides);
    }
  }

  async function saveDailyRate() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "daily_rate", value: dailyRate }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Daily rate updated");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function fetchBlockedDates() {
    const res = await fetch("/api/availability");
    if (res.ok) {
      const data = await res.json();
      setBlockedDates(data.blockedDates);
    }
  }

  async function saveAvailableRanges(ranges: DateRange[]) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "available_date_ranges", value: ranges }),
    });
    if (res.ok) {
      setAvailableRanges(ranges);
      setRangeMessage("Availability updated");
      setTimeout(() => setRangeMessage(""), 3000);
    }
  }

  function handleAddRange() {
    if (!newRangeFrom || !newRangeTo) return;
    if (newRangeTo < newRangeFrom) return;
    const updated = [...availableRanges, { from: newRangeFrom, to: newRangeTo }];
    updated.sort((a, b) => a.from.localeCompare(b.from));
    saveAvailableRanges(updated);
    setNewRangeFrom("");
    setNewRangeTo("");
  }

  function handleRemoveRange(index: number) {
    const updated = availableRanges.filter((_, i) => i !== index);
    saveAvailableRanges(updated);
  }

  async function handleOverrideChange(date: string, price: number) {
    const res = await fetch("/api/admin/price-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, price }),
    });
    if (res.ok) {
      fetchOverrides();
    }
  }

  async function handleOverrideRemove(id: number) {
    const res = await fetch(`/api/admin/price-overrides?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchOverrides();
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Settings</h1>

      {/* Daily Rate */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Default Daily Rate</h2>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">&euro;</span>
          <input
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(parseFloat(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            min="0"
            step="1"
          />
          <button
            onClick={saveDailyRate}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {message && (
          <p className="text-green-600 text-sm mt-2">{message}</p>
        )}
      </div>

      {/* Available Date Ranges */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Bookable Date Ranges</h2>
        <p className="text-sm text-gray-500 mb-4">
          Define when the property is available for booking. At least one range must be set for guests to book.
        </p>

        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={newRangeFrom}
              onChange={(e) => setNewRangeFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={newRangeTo}
              onChange={(e) => setNewRangeTo(e.target.value)}
              min={newRangeFrom}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <button
            onClick={handleAddRange}
            disabled={!newRangeFrom || !newRangeTo || newRangeTo < newRangeFrom}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Add Range
          </button>
        </div>

        {rangeMessage && (
          <p className="text-green-600 text-sm mb-3">{rangeMessage}</p>
        )}

        {availableRanges.length === 0 ? (
          <p className="text-gray-400 text-sm">No date ranges set &mdash; no dates are currently bookable.</p>
        ) : (
          <div className="space-y-2">
            {availableRanges.map((range, i) => (
              <div
                key={`${range.from}-${range.to}`}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
              >
                <span className="text-sm text-gray-700">
                  {range.from} &rarr; {range.to}
                </span>
                <button
                  onClick={() => handleRemoveRange(i)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Calendar */}
      <AdminCalendar
        dailyRate={dailyRate}
        overrides={overrides}
        blockedDates={blockedDates}
        availableRanges={availableRanges}
        onOverrideChange={handleOverrideChange}
        onOverrideRemove={handleOverrideRemove}
      />
    </div>
  );
}
