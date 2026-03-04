"use client";

import { useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import PriceSummary from "./PriceSummary";

interface BookingFormProps {
  selectedRange: DateRange;
  dailyRate: number;
  priceOverrides: { date: string; price: number }[];
}

export default function BookingForm({
  selectedRange,
  dailyRate,
  priceOverrides,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!selectedRange.from || !selectedRange.to) return null;

  const stayDates = eachDayOfInterval({
    start: selectedRange.from,
    end: selectedRange.to,
  });

  if (stayDates.length === 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in: format(selectedRange.from!, "yyyy-MM-dd"),
          check_out: format(selectedRange.to!, "yyyy-MM-dd"),
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          referral,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit booking");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-emerald-800 mb-2">
          Booking Request Submitted!
        </h3>
        <p className="text-emerald-700">
          Thank you! We&apos;ll review your request and get back to you by email
          shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PriceSummary
        selectedRange={selectedRange}
        dailyRate={dailyRate}
        priceOverrides={priceOverrides}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-stone-800">
          Your Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            How are we connected? *
          </label>
          <textarea
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            rows={3}
            placeholder="e.g. friend of Sarah, coworker of Mike, etc."
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-700 text-white py-3 rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors font-medium"
        >
          {submitting ? "Submitting..." : "Request to Book"}
        </button>
      </form>
    </div>
  );
}
