"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Booking {
  id: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  introduction: string;
  referral: string | null;
  total_price: number;
  nightly_breakdown: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  created_at: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    if (res.ok) {
      const data = await res.json();
      const found = data.bookings.find(
        (b: Booking) => b.id === Number(params.id)
      );
      setBooking(found || null);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  async function handleStatusChange(status: "approved" | "denied" | "cancelled") {
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking!.id, status }),
    });
    if (res.ok) {
      fetchBooking();
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!booking) return <p className="text-gray-500">Booking not found.</p>;

  const breakdown: Record<string, number> = JSON.parse(
    booking.nightly_breakdown
  );

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:text-blue-800 mb-4 text-sm"
      >
        &larr; Back to bookings
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Booking #{booking.id}
          </h1>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[booking.status]}`}
          >
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Guest Name</p>
            <p className="font-medium text-gray-900">{booking.guest_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{booking.guest_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{booking.guest_phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="font-medium text-gray-900">
              {new Date(booking.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-in</p>
            <p className="font-medium text-gray-900">{booking.check_in}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-out</p>
            <p className="font-medium text-gray-900">{booking.check_out}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Introduction</p>
          <p className="text-gray-900">{booking.introduction}</p>
        </div>

        {booking.referral && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Referral</p>
            <p className="text-gray-900">{booking.referral}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Nightly Breakdown</p>
          <div className="bg-gray-50 rounded-md p-4 space-y-1">
            {Object.entries(breakdown).map(([date, price]) => (
              <div key={date} className="flex justify-between text-sm">
                <span className="text-gray-700">{date}</span>
                <span className="text-gray-900">&euro;{price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">&euro;{booking.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {booking.status === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange("approved")}
              className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange("denied")}
              className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Deny
            </button>
          </div>
        )}

        {booking.status === "approved" && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirm("Are you sure you want to cancel this booking? The guest will be notified.")) {
                  handleStatusChange("cancelled");
                }
              }}
              className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
