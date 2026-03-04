"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { DateRange } from "react-day-picker";
import { isBefore, startOfDay, parseISO, isWithinInterval, eachDayOfInterval, format } from "date-fns";
import PhotoDialog, { photos } from "@/components/PhotoGallery";
import BookingForm from "@/components/BookingForm";

interface AvailabilityData {
  blockedDates: string[];
  availableDateRanges: { from: string; to: string }[];
  dailyRate: number;
  priceOverrides: { date: string; price: number }[];
}

const amenityCategories = [
  {
    title: "Kitchen & Dining",
    items: [
      { name: "Fully equipped kitchen", icon: "M3 3h18v6H3V3zm0 8h18v10H3V11zm4 3h2v4H7v-4z" },
      { name: "Coffee maker", icon: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-4h8v4H6V4z" },
      { name: "Community BBQ", icon: "M12 2c.6 3.5-1 5-1 5s2.5 1 2 5h-6c-.5-4 2-5 2-5s-1.6-1.5-1-5h4zm-4 12h8v2H8v-2zm1 4h6v2H9v-2z" },
    ],
  },
  {
    title: "Comfort & Climate",
    items: [
      { name: "Air conditioning", icon: "M12 3v1m0 16v1m-7.07-2.93l.7-.7m12.73-12.73l.7-.7M3 12h1m16 0h1m-2.93 7.07l-.7-.7M5.64 5.64l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
      { name: "Linens & towels provided", icon: "M3 7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" },
      { name: "Self-watering houseplants", icon: "M12 21c-1.5-3-5-6-5-10a5 5 0 0110 0c0 4-3.5 7-5 10z" },
    ],
  },
  {
    title: "Laundry & Grooming",
    items: [
      { name: "Washing machine", icon: "M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm7 5a5 5 0 110 10 5 5 0 010-10zm0 3a2 2 0 100 4 2 2 0 000-4zM7 6a1 1 0 110 2 1 1 0 010-2z" },
      { name: "Drying machine", icon: "M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm7 5a5 5 0 110 10 5 5 0 010-10zm-2 5l4-2v4l-4-2zM7 6a1 1 0 110 2 1 1 0 010-2z" },
      { name: "Hair dryer", icon: "M21 6c0-1.1-.9-2-2-2h-3l-2 2H7a4 4 0 000 8h7l2 2h3a2 2 0 002-2V6zM3 10h4" },
      { name: "Iron & ironing board", icon: "M6 20h12M4 14h16l-2-6H6l-2 6zm4-8h8" },
    ],
  },
  {
    title: "Entertainment & Tech",
    items: [
      { name: "High-speed WiFi", icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" },
      { name: "Flat-screen TV", icon: "M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm4 14h8" },
    ],
  },
  {
    title: "Outdoor & Fitness",
    items: [
      { name: "Private patio with couch", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
      { name: "Community pool", icon: "M3 17.25c1.5-2 3-3 4.5-1s3 1 4.5-1 3-3 4.5-1 3 1 4.5-1M3 13.25c1.5-2 3-3 4.5-1s3 1 4.5-1 3-3 4.5-1 3 1 4.5-1" },
      { name: "Apartment gym (steps away)", icon: "M4 15h2a1 1 0 001-1v-4a1 1 0 00-1-1H4m16 0h-2a1 1 0 00-1 1v4a1 1 0 001 1h2M6 12h12" },
    ],
  },
  {
    title: "Building & Location",
    items: [
      { name: "Keyless entry", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { name: "Central Venice location", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
];

export default function HomePage() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [heroLightboxIndex, setHeroLightboxIndex] = useState<number | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [bookingSectionVisible, setBookingSectionVisible] = useState(false);
  const [arrowTopOffset, setArrowTopOffset] = useState<number | null>(null);
  const [fixedTranslateY, setFixedTranslateY] = useState<number | null>(null);
  const [dpHeight, setDpHeight] = useState<number | undefined>(undefined);
  const [layoutReady, setLayoutReady] = useState(false);
  const [splashTransform, setSplashTransform] = useState('');
  const splashTitleRef = useRef<HTMLHeadingElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dpInnerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bookingSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const measureLayout = () => {
      if (outerRef.current && calendarRef.current) {
        const calTop = calendarRef.current.offsetTop;
        const calH = calendarRef.current.offsetHeight;
        // Calendar midpoint should sit at the hero bottom edge
        const translateY = calTop + calH / 2;
        setFixedTranslateY(translateY);
        // Arrow offset: hero boundary relative to calendar top
        setArrowTopOffset(calH / 2);
      }
    };
    const checkAll = () => {
      measureLayout();
    };
    const checkScroll = () => {
      if (bookingSectionRef.current) {
        const rect = bookingSectionRef.current.getBoundingClientRect();
        setBookingSectionVisible(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };
    checkAll();
    checkScroll();
    window.addEventListener("resize", checkAll);
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", checkAll);
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  // After calendar renders: measure layout and reveal, start ResizeObserver
  useEffect(() => {
    // Double-rAF ensures layout is fully settled across browsers
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (outerRef.current && calendarRef.current) {
          const calTop = calendarRef.current.offsetTop;
          const calH = calendarRef.current.offsetHeight;
          setFixedTranslateY(calTop + calH / 2);
          setArrowTopOffset(calH / 2);
        }
      });
    });

    if (!dpInnerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDpHeight(entry.contentRect.height);
      }
    });
    observer.observe(dpInnerRef.current);
    return () => observer.disconnect();
  }, [availability]);

  // Once transforms are applied, measure title target and reveal
  useEffect(() => {
    if (fixedTranslateY === null || !availability) return;
    requestAnimationFrame(() => {
      if (splashTitleRef.current && titleRef.current) {
        const splash = splashTitleRef.current.getBoundingClientRect();
        const realH1 = titleRef.current.querySelector('h1');
        if (realH1) {
          const target = realH1.getBoundingClientRect();
          const dx = (target.left + target.width / 2) - (splash.left + splash.width / 2);
          const dy = (target.top + target.height / 2) - (splash.top + splash.height / 2);
          setSplashTransform(`translate(${dx}px, ${dy}px)`);
        }
      }
      setLayoutReady(true);
    });
  }, [fixedTranslateY, availability]);

  useEffect(() => {
    fetch("/api/availability")
      .then((res) => res.json())
      .then((data) => {
        setAvailability(data);
        setLoading(false);
        // Auto-forward to first month with available dates
        if (data.availableDateRanges?.length > 0) {
          const today = startOfDay(new Date());
          const firstAvail = parseISO(data.availableDateRanges[0].from);
          const target = isBefore(firstAvail, today) ? today : firstAvail;
          const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const targetMonth = new Date(target.getFullYear(), target.getMonth(), 1);
          if (targetMonth > currentMonth) {
            setMonth(targetMonth);
          }
        }
      })
      .catch(() => {
        setLoading(false);
        setLayoutReady(true);
      });
  }, []);

  // Compute earliest and latest months with available dates
  const today = startOfDay(new Date());
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Collect all months that have at least one bookable date
  const bookableMonths = new Set<string>();
  if (availability?.availableDateRanges) {
    const blockedSet = new Set(availability.blockedDates);
    for (const range of availability.availableDateRanges) {
      const from = parseISO(range.from);
      const to = parseISO(range.to);
      const days = eachDayOfInterval({ start: from, end: to });
      for (const day of days) {
        if (isBefore(day, today)) continue;
        const dateStr = format(day, "yyyy-MM-dd");
        if (blockedSet.has(dateStr)) continue;
        const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
        bookableMonths.add(monthKey);
      }
    }
  }

  const bookableMonthArr = Array.from(bookableMonths);
  const hasBookableBefore = bookableMonthArr.some((key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m, 1) < month;
  });
  const hasBookableAfter = bookableMonthArr.some((key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m, 1) > month;
  });

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const canGoPrev = hasBookableBefore && prevMonth >= currentMonth;
  const canGoNext = hasBookableAfter;

  const hasRange = !!(selectedRange?.from && selectedRange?.to && availability);
  let totalPrice = 0;
  if (hasRange) {
    const overrideMap = new Map(
      availability!.priceOverrides.map((o) => [o.date, o.price])
    );
    const stayDates = eachDayOfInterval({
      start: selectedRange!.from!,
      end: selectedRange!.to!,
    });
    totalPrice = stayDates.reduce((sum, date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return sum + (overrideMap.get(dateStr) ?? availability!.dailyRate);
    }, 0);
  }

  return (
    <main className="min-h-screen bg-stone-50 overflow-x-hidden">
      {/* Splash overlay — covers page until layout is ready */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${
          layoutReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className={`absolute inset-0 bg-stone-900 transition-opacity duration-700 ${layoutReady ? "opacity-0" : "opacity-100"}`} />
        <h1
          ref={splashTitleRef}
          className="relative z-10 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent transition-transform duration-700 ease-in-out"
          style={{ fontFamily: "var(--font-title), serif", transform: splashTransform || undefined }}
        >
          Venice Beach Pad
        </h1>
      </div>




      <section className="relative h-[60vh] w-full overflow-hidden">
        {/* Mosaic rows */}
        <div className="flex flex-col gap-2 h-full py-2">
          {/* Row 1 — scrolls left, 60s */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-2 h-full w-max"
              style={{ animation: "scroll-left 60s linear infinite" }}
            >
              {[
                { photo: photos[6], w: 400 },
                { photo: photos[12], w: 190 },
                { photo: photos[2], w: 400 },
                { photo: photos[14], w: 270 },
                { photo: photos[7], w: 400 },
                { photo: photos[1], w: 190 },
                { photo: photos[18], w: 270 },
              ].flatMap((item, i) => [
                { ...item, key: `r1a-${i}` },
                { ...item, key: `r1b-${i}` },
              ]).map(({ photo, w, key }) => (
                <div
                  key={key}
                  className="relative h-full rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                  style={{ width: `${w}px` }}
                  onClick={() => setHeroLightboxIndex(photos.indexOf(photo))}
                >
                  <Image
                    src={`/images/${photo}`}
                    alt="Venice apartment"
                    fill
                    className="object-cover"
                    sizes={`${w}px`}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Row 2 — scrolls right, 65s */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-2 h-full w-max"
              style={{ animation: "scroll-right 65s linear infinite" }}
            >
              {[
                { photo: photos[3], w: 380 },
                { photo: photos[9], w: 190 },
                { photo: photos[19], w: 420 },
                { photo: photos[15], w: 190 },
                { photo: photos[0], w: 270 },
                { photo: photos[5], w: 260 },
                { photo: photos[4], w: 270 },
              ].flatMap((item, i) => [
                { ...item, key: `r2a-${i}` },
                { ...item, key: `r2b-${i}` },
              ]).map(({ photo, w, key }) => (
                <div
                  key={key}
                  className="relative h-full rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                  style={{ width: `${w}px` }}
                  onClick={() => setHeroLightboxIndex(photos.indexOf(photo))}
                >
                  <Image
                    src={`/images/${photo}`}
                    alt="Venice apartment"
                    fill
                    className="object-cover"
                    sizes={`${w}px`}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Row 3 — scrolls left, 55s */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-2 h-full w-max"
              style={{ animation: "scroll-left 55s linear infinite" }}
            >
              {[
                { photo: photos[10], w: 400 },
                { photo: photos[17], w: 190 },
                { photo: photos[16], w: 300 },
                { photo: photos[11], w: 190 },
                { photo: photos[8], w: 280 },
                { photo: photos[13], w: 190 },
              ].flatMap((item, i) => [
                { ...item, key: `r3a-${i}` },
                { ...item, key: `r3b-${i}` },
              ]).map(({ photo, w, key }) => (
                <div
                  key={key}
                  className="relative h-full rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                  style={{ width: `${w}px` }}
                  onClick={() => setHeroLightboxIndex(photos.indexOf(photo))}
                >
                  <Image
                    src={`/images/${photo}`}
                    alt="Venice apartment"
                    fill
                    className="object-cover"
                    sizes={`${w}px`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </section>

      {/* Title + Calendar — calendar midpoint sits at the hero/content horizon */}
      <div
        ref={outerRef}
        className={`relative z-10 flex flex-col items-center px-4 mb-[-120px] transition-opacity duration-500 pointer-events-none ${layoutReady ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: `translateY(-${fixedTranslateY !== null ? `${fixedTranslateY}px` : '50%'})` }}
      >
        <div
          ref={titleRef}
          className="text-center text-white px-8 py-6 mb-4 rounded-2xl bg-gradient-to-br from-amber-900/60 via-stone-900/50 to-stone-800/40 backdrop-blur-sm pointer-events-auto"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            maskComposite: "intersect",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskComposite: "destination-in",
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent" style={{ fontFamily: "var(--font-title), serif" }}>
            Venice Beach Pad
          </h1>
          <p className="text-base md:text-lg text-stone-200 drop-shadow-md">
            Sun-filled 1 bed, 1 bath &middot; full kitchen &middot; private patio retreat
          </p>
        </div>
        <div ref={calendarRef} className="relative pointer-events-auto">
          {/* Calendar nav arrows — outside the white box, at the hero/content boundary */}
          <button
            onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
            disabled={!canGoPrev}
            className={`absolute -left-6 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] ${
              canGoPrev
                ? "bg-white/20 hover:bg-white/30 text-amber-700 hover:scale-110 active:scale-95 cursor-pointer"
                : "bg-white/10 text-stone-400 cursor-not-allowed opacity-50"
            }`}
            style={{ top: arrowTopOffset ?? 0 }}
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
            disabled={!canGoNext}
            className={`absolute -right-6 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] ${
              canGoNext
                ? "bg-white/20 hover:bg-white/30 text-amber-700 hover:scale-110 active:scale-95 cursor-pointer"
                : "bg-white/10 text-stone-400 cursor-not-allowed opacity-50"
            }`}
            style={{ top: arrowTopOffset ?? 0 }}
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div
            className="bg-white rounded-xl shadow-xl px-6 pt-4 pb-8 relative overflow-hidden"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest("button, .rdp-day, .rdp-nav, svg")) {
                setSelectedRange(undefined);
              }
            }}
          >
            {/* Price ribbon */}
            <div
              className={`absolute top-0 right-0 w-[120px] h-[120px] z-10 transition-opacity duration-500 cursor-pointer ${
                hasRange ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div
                className="absolute top-[18px] right-[-32px] w-[170px] text-center rotate-45 py-1.5 text-amber-900 text-xs font-semibold tracking-wide hover:brightness-110 transition-all"
                style={{
                  background: "linear-gradient(135deg, #f5d020, #f7e06e 40%, #e6b800 60%, #f7e06e)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.5)",
                }}
              >
                ${totalPrice.toLocaleString()}
              </div>
            </div>
            {availability && (
              <div
                className="overflow-hidden transition-[height] duration-300 ease-in-out"
                style={{ height: dpHeight !== undefined ? `${dpHeight}px` : 'auto' }}
              >
              <div ref={dpInnerRef} className="pb-2">
              <DayPicker
                mode="range"
                month={month}
                onMonthChange={setMonth}
                selected={selectedRange}
                onSelect={(range) => {
                  // If a complete range exists and user clicks a new date, start fresh
                  if (selectedRange?.from && selectedRange?.to && range?.from) {
                    setSelectedRange({ from: range.from, to: undefined });
                  } else {
                    setSelectedRange(range);
                  }
                }}
                numberOfMonths={1}
                showOutsideDays={false}
                modifiers={{
                  unavailable: (date: Date) => {
                    const t = startOfDay(new Date());
                    if (isBefore(date, t)) return false;
                    const dateStr = date.toISOString().split("T")[0];
                    if (new Set(availability.blockedDates).has(dateStr)) return true;
                    if (availability.availableDateRanges.length === 0) return true;
                    return !availability.availableDateRanges.some((range) =>
                      isWithinInterval(date, {
                        start: parseISO(range.from),
                        end: parseISO(range.to),
                      })
                    );
                  },
                }}
                modifiersStyles={{
                  unavailable: { position: "relative" as const },
                }}
                hidden={(date) => {
                  const t = startOfDay(new Date());
                  return isBefore(date, t);
                }}
                components={{
                  DayContent: ({ date }: { date: Date }) => {
                    const t = startOfDay(new Date());
                    const isUnavail = (() => {
                      if (isBefore(date, t)) return false;
                      const dateStr = date.toISOString().split("T")[0];
                      if (new Set(availability.blockedDates).has(dateStr)) return true;
                      if (availability.availableDateRanges.length === 0) return true;
                      return !availability.availableDateRanges.some((range) =>
                        isWithinInterval(date, {
                          start: parseISO(range.from),
                          end: parseISO(range.to),
                        })
                      );
                    })();
                    if (isUnavail) {
                      return (
                        <span className="flex items-center justify-center w-full h-full">
                          <span className="text-xl font-semibold" style={{ color: "#d6d3d1" }}>&times;</span>
                        </span>
                      );
                    }
                    return <span>{date.getDate()}</span>;
                  },
                }}
                disabled={(date) => {
                  const t = startOfDay(new Date());
                  // Disable unavailable dates (shown as dots)
                  if (!isBefore(date, t)) {
                    const dateStr = date.toISOString().split("T")[0];
                    const blockedSet = new Set(availability.blockedDates);
                    if (blockedSet.has(dateStr)) return true;
                    if (availability.availableDateRanges.length === 0) return true;
                    const inRange = availability.availableDateRanges.some((range) =>
                      isWithinInterval(date, { start: parseISO(range.from), end: parseISO(range.to) })
                    );
                    if (!inRange) return true;
                  }
                  // When start is selected but no end, disable dates beyond the next gap
                  if (selectedRange?.from && !selectedRange?.to) {
                    const start = startOfDay(selectedRange.from);
                    if (isBefore(date, start)) return true;
                    const blockedSet = new Set(availability.blockedDates);
                    const d = new Date(start);
                    while (d <= date) {
                      const ds = d.toISOString().split("T")[0];
                      const inRange = availability.availableDateRanges.some((range) =>
                        isWithinInterval(d, { start: parseISO(range.from), end: parseISO(range.to) })
                      );
                      if (!inRange || blockedSet.has(ds)) {
                        return date >= d;
                      }
                      d.setDate(d.getDate() + 1);
                    }
                  }
                  return false;
                }}
                className="!font-sans"
                classNames={{
                  months: "flex flex-col sm:flex-row gap-4",
                  month: "space-y-4",
                  caption:
                    "flex justify-center pt-1 items-center text-stone-800",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-stone-500 rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative",
                  day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 hover:bg-stone-200 rounded-full inline-flex items-center justify-center",
                  day_selected:
                    "!bg-amber-700 !text-white hover:!bg-amber-800 focus:!bg-amber-800",
                  day_today: "bg-stone-200 font-semibold",
                  day_outside: "text-stone-400 opacity-50",
                  day_disabled: "text-stone-300 opacity-100 cursor-default pointer-events-none",
                  day_range_middle: "!bg-amber-100 !text-amber-900",
                  day_range_start: "!bg-amber-700 !text-white rounded-full",
                  day_range_end: "!bg-amber-700 !text-white rounded-full",
                  day_hidden: "invisible",
                }}
              />
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 md:px-16 pb-12 -mt-56">
        {/* Description */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-stone-800 mb-6 font-heading">
            About the Apartment
          </h2>
          <div className="text-stone-600 text-lg leading-relaxed space-y-4">
            <p>
              I travel a lot and my Venice apartment sits empty for long
              stretches at a time. Rather than let it go to waste, I&apos;d love
              for someone to enjoy it while I&apos;m away. This is my actual
              home &mdash; fully furnished with everything you need, from a
              stocked kitchen to a private patio with an outdoor couch. There&apos;s
              also a community BBQ area and apartment gym just steps away.
            </p>
            <p>
              If we know each other, just call or text me and we&apos;ll work
              it out. If you found this through a mutual connection, feel free
              to reach out the same way. And if we haven&apos;t crossed paths
              yet &mdash; you&apos;re just as welcome. Fill out the booking
              request below, tell me a little about yourself, and let&apos;s
              make it happen.
            </p>
          </div>
          <h3 className="text-xl font-bold text-stone-800 mt-8 mb-4 font-heading">
            What&apos;s Nearby
          </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {/* Venice Beach & Boardwalk */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25c1.5-2 3-3 4.5-1s3 1 4.5-1 3-3 4.5-1 3 1 4.5-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.25c1.5-2 3-3 4.5-1s3 1 4.5-1 3-3 4.5-1 3 1 4.5-1" />
                    <circle cx="17" cy="6" r="2.5" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Venice Beach &amp; Boardwalk</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~1 mi / 20 min walk</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Street performers, Muscle Beach, the Venice Sign, and the iconic skate park.</p>
              </div>

              {/* Abbot Kinney Blvd */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Abbot Kinney Blvd</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~1 mi / 20 min walk</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">World-class restaurants like Gjelina, Felix, and Gjusta, plus boutique shopping and galleries on &ldquo;the coolest block in America.&rdquo;</p>
              </div>

              {/* Venice Canals */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c1.5-1.5 3-2 4.5-.5s3 .5 4.5-1 3-2 4.5-.5 3 .5 4.5-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16c1.5-1.5 3-2 4.5-.5s3 .5 4.5-1 3-2 4.5-.5 3 .5 4.5-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12V4m14 8V4M8 6h8" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Venice Canals</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~1.2 mi / 25 min walk</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">A peaceful neighborhood of charming walkable canals.</p>
              </div>

              {/* Santa Monica Pier */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1m8-8h-1M5 12H4m13.66-5.66-.7.7M7.05 16.95l-.7.7m11.31 0-.7-.7M7.05 7.05l-.7-.7" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Santa Monica Pier</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~3 mi / 10 min drive</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Ferris wheel, aquarium, and the 3rd Street Promenade shopping district.</p>
              </div>

              {/* Marina del Rey */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0 4 10H8L12 4Zm0 0V2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 18c1.5-1.5 3-2 4.5-.5s3 .5 4.5-1 3-2 4.5-.5 3 .5 4.5-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Marina del Rey</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~2 mi / 8 min drive</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Waterfront dining and boat rentals.</p>
              </div>

              {/* Grocery Stores */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Grocery Stores</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">5&ndash;10 min walk</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Ralph&apos;s and Whole Foods within walking distance on Lincoln Blvd.</p>
              </div>

              {/* Penmar Park */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-1.5-3-5-6-5-10a5 5 0 0 1 10 0c0 4-3.5 7-5 10Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c1-2.5 3.5-5 3.5-8.5a3.5 3.5 0 0 0-7 0c0 3.5 2.5 6 3.5 8.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">Penmar Park</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">~5 min walk</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Plus a golf course right next door.</p>
              </div>

              {/* LAX Airport */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  <div>
                    <p className="font-semibold text-stone-800 leading-tight">LAX Airport</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">20&ndash;30 min drive</span>
                  </div>
                </div>
                <p className="text-sm text-stone-600">Los Angeles International Airport.</p>
              </div>
            </div>

            {/* Bike Trail Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-7 h-7 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3.5 11.5L14 11l-4-1 1.5-3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m14 11 4.5 6.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 17.5 10 11l1.5 6.5" />
              </svg>
              <p className="text-sm text-amber-900">
                The area is very bikeable with easy access to the <strong>Marvin Braude Coastal Bike Trail</strong>, which runs 22 miles along the beach.
              </p>
          </div>

          <p className="text-stone-500 text-sm mt-4 italic">
            Interested? I&apos;ll share the exact address once we connect.
          </p>

        </section>

        {/* Amenities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-stone-800 mb-6 font-heading">Amenities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenityCategories.map((cat) => (
              <div key={cat.title}>
                <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">{cat.title}</h3>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 text-stone-600">
                      <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" ref={bookingSectionRef} className="mb-16">
          <h2 className="text-3xl font-bold text-stone-800 mb-6 font-heading">
            Request to Book
          </h2>

          {loading ? (
            <p className="text-stone-500">Loading availability...</p>
          ) : availability ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-stone-500 mb-4">
                  Select your check-in and check-out dates:
                </p>
                <div className="relative inline-block">
                  <button
                    onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
                    disabled={!canGoPrev}
                    className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] ${
                      canGoPrev
                        ? "bg-white/20 hover:bg-white/30 text-amber-700 hover:scale-110 active:scale-95 cursor-pointer"
                        : "bg-white/10 text-stone-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
                    disabled={!canGoNext}
                    className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] ${
                      canGoNext
                        ? "bg-white/20 hover:bg-white/30 text-amber-700 hover:scale-110 active:scale-95 cursor-pointer"
                        : "bg-white/10 text-stone-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div
                    className="bg-white rounded-xl shadow-xl px-4 pt-3 pb-4 relative overflow-hidden inline-block"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest("button, .rdp-day, .rdp-nav, svg")) {
                        setSelectedRange(undefined);
                      }
                    }}
                  >
                    {/* Price ribbon */}
                    <div
                      className={`absolute top-0 right-0 w-[120px] h-[120px] z-10 transition-opacity duration-500 ${
                        hasRange ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                      }`}
                    >
                      <div
                        className="absolute top-[18px] right-[-32px] w-[170px] text-center rotate-45 py-1.5 text-amber-900 text-xs font-semibold tracking-wide"
                        style={{
                          background: "linear-gradient(135deg, #f5d020, #f7e06e 40%, #e6b800 60%, #f7e06e)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.5)",
                        }}
                      >
                        ${totalPrice.toLocaleString()}
                      </div>
                    </div>
                    <DayPicker
                      mode="range"
                      month={month}
                      onMonthChange={setMonth}
                      selected={selectedRange}
                      onSelect={(range) => {
                        if (selectedRange?.from && selectedRange?.to && range?.from) {
                          setSelectedRange({ from: range.from, to: undefined });
                        } else {
                          setSelectedRange(range);
                        }
                      }}
                      numberOfMonths={1}
                      showOutsideDays={false}
                      modifiers={{
                        unavailable: (date: Date) => {
                          const t = startOfDay(new Date());
                          if (isBefore(date, t)) return false;
                          const dateStr = date.toISOString().split("T")[0];
                          if (new Set(availability.blockedDates).has(dateStr)) return true;
                          if (availability.availableDateRanges.length === 0) return true;
                          return !availability.availableDateRanges.some((range) =>
                            isWithinInterval(date, { start: parseISO(range.from), end: parseISO(range.to) })
                          );
                        },
                      }}
                      modifiersStyles={{
                        unavailable: { position: "relative" as const },
                      }}
                      hidden={(date) => isBefore(date, startOfDay(new Date()))}
                      components={{
                        DayContent: ({ date }: { date: Date }) => {
                          const t = startOfDay(new Date());
                          const isUnavail = (() => {
                            if (isBefore(date, t)) return false;
                            const dateStr = date.toISOString().split("T")[0];
                            if (new Set(availability.blockedDates).has(dateStr)) return true;
                            if (availability.availableDateRanges.length === 0) return true;
                            return !availability.availableDateRanges.some((range) =>
                              isWithinInterval(date, { start: parseISO(range.from), end: parseISO(range.to) })
                            );
                          })();
                          if (isUnavail) {
                            return (
                              <span className="flex items-center justify-center w-full h-full">
                                <span className="text-xl font-semibold" style={{ color: "#d6d3d1" }}>&times;</span>
                              </span>
                            );
                          }
                          return <span>{date.getDate()}</span>;
                        },
                      }}
                      disabled={(date) => {
                        const t = startOfDay(new Date());
                        if (!isBefore(date, t)) {
                          const dateStr = date.toISOString().split("T")[0];
                          const blockedSet = new Set(availability.blockedDates);
                          if (blockedSet.has(dateStr)) return true;
                          if (availability.availableDateRanges.length === 0) return true;
                          const inRange = availability.availableDateRanges.some((range) =>
                            isWithinInterval(date, { start: parseISO(range.from), end: parseISO(range.to) })
                          );
                          if (!inRange) return true;
                        }
                        if (selectedRange?.from && !selectedRange?.to) {
                          const start = startOfDay(selectedRange.from);
                          if (isBefore(date, start)) return true;
                          const blockedSet = new Set(availability.blockedDates);
                          const d = new Date(start);
                          while (d <= date) {
                            const ds = d.toISOString().split("T")[0];
                            const inRange = availability.availableDateRanges.some((range) =>
                              isWithinInterval(d, { start: parseISO(range.from), end: parseISO(range.to) })
                            );
                            if (!inRange || blockedSet.has(ds)) { return date >= d; }
                            d.setDate(d.getDate() + 1);
                          }
                        }
                        return false;
                      }}
                      className="!font-sans"
                      classNames={{
                        months: "flex flex-col sm:flex-row gap-4",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 items-center text-stone-800",
                        caption_label: "text-sm font-medium",
                        nav: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-stone-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 hover:bg-stone-200 rounded-full inline-flex items-center justify-center",
                        day_selected: "!bg-amber-700 !text-white hover:!bg-amber-800 focus:!bg-amber-800",
                        day_today: "bg-stone-200 font-semibold",
                        day_outside: "text-stone-400 opacity-50",
                        day_disabled: "text-stone-300 opacity-100 cursor-default pointer-events-none",
                        day_range_middle: "!bg-amber-100 !text-amber-900",
                        day_range_start: "!bg-amber-700 !text-white rounded-full",
                        day_range_end: "!bg-amber-700 !text-white rounded-full",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                {selectedRange?.from && selectedRange?.to ? (
                  <BookingForm
                    selectedRange={selectedRange}
                  />
                ) : (
                  <div className="bg-stone-100 rounded-lg p-8 text-center border border-stone-200">
                    <p className="text-stone-500">
                      Select your dates on the calendar to see pricing and
                      request a booking.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-red-500">
              Failed to load availability. Please try again later.
            </p>
          )}
        </section>
      </div>

      {/* Fixed contact bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-amber-950/80 backdrop-blur-xl border border-amber-400/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_2px_rgba(0,0,0,0.2)] transition-all duration-300">
        <div className="flex items-center justify-center p-1.5">
          <button
            onClick={() => {
              if (!bookingSectionVisible) {
                document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`inline-flex items-center justify-center rounded-lg text-sm font-bold overflow-hidden transition-all duration-300 ease-in-out ${
              hasRange && !bookingSectionVisible
                ? "w-[36px] h-[36px] opacity-100 bg-white/25 hover:bg-white/35 text-white cursor-pointer mr-1.5"
                : "w-0 h-[36px] opacity-0 pointer-events-none mr-0"
            }`}
          >
            <span className="flex flex-col items-center -space-y-1.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
              <svg className="w-3.5 h-3.5 animate-bounce [animation-delay:150ms] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          <a
            href="sms:+15125176805"
            className="inline-flex items-center gap-1.5 px-3 h-[36px] rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <span className="hidden sm:inline">Text</span>
          </a>
          <div className="w-1.5" />
          <a
            href="tel:+15125176805"
            className="inline-flex items-center gap-1.5 px-3 h-[36px] rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            <span className="hidden sm:inline">Call</span>
          </a>
          <div className="w-1.5" />
          <a
            href="mailto:hsuregan@gmail.com"
            className="inline-flex items-center gap-1.5 px-3 h-[36px] rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span className="hidden sm:inline">Email</span>
          </a>
          <div className="w-1.5" />
          <button
            onClick={() => setShowAllPhotos(true)}
            className="inline-flex items-center gap-1.5 px-3 h-[36px] rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Photos</span>
          </button>
        </div>
      </div>

      {/* Footer */}

      <PhotoDialog open={showAllPhotos} onClose={() => setShowAllPhotos(false)} />
      <PhotoDialog open={heroLightboxIndex !== null} onClose={() => setHeroLightboxIndex(null)} initialIndex={heroLightboxIndex} />
    </main>
  );
}
