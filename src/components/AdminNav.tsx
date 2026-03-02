"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Bookings" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 text-white w-64 min-h-screen p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-8">Admin Panel</h1>
      <ul className="space-y-2 flex-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block px-4 py-2 rounded transition-colors ${
                pathname === item.href
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-auto px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors text-left"
      >
        Sign Out
      </button>
    </nav>
  );
}
