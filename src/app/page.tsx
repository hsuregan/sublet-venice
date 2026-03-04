"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { DateRange } from "react-day-picker";
import { isBefore, startOfDay, parseISO, isWithinInterval, eachDayOfInterval, format } from "date-fns";
import PhotoDialog, { photos } from "@/components/PhotoGallery";
import BookingCalendar from "@/components/BookingCalendar";
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
  const [isMobile, setIsMobile] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [heroLightboxIndex, setHeroLightboxIndex] = useState<number | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [pastCarousel, setPastCarousel] = useState(false);
  const [bookingSectionVisible, setBookingSectionVisible] = useState(false);
  const [canFitSideButton, setCanFitSideButton] = useState(true);
  const [sideButtonVisible, setSideButtonVisible] = useState(true);
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
  const sideButtonRef = useRef<HTMLDivElement>(null);

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
      setIsMobile(window.innerWidth < 640);
      if (calendarRef.current) {
        const calendarRight = calendarRef.current.getBoundingClientRect().right;
        setCanFitSideButton(calendarRight + 160 < window.innerWidth);
      }
      measureLayout();
    };
    const checkScroll = () => {
      if (titleRef.current) {
        const titleTop = titleRef.current.getBoundingClientRect().top;
        setPastCarousel(titleTop <= 0);
      }
      if (bookingSectionRef.current) {
        const rect = bookingSectionRef.current.getBoundingClientRect();
        setBookingSectionVisible(rect.top < window.innerHeight && rect.bottom > 0);
      }
      if (sideButtonRef.current) {
        const rect = sideButtonRef.current.getBoundingClientRect();
        setSideButtonVisible(rect.bottom > 0 && rect.top < window.innerHeight);
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
      })
      .catch(() => setLoading(false));
  }, []);

  const hasRange = !!(selectedRange?.from && selectedRange?.to && availability);
  let heroTotal = 0;
  let heroNights = 0;
  if (hasRange) {
    const overrideMap = new Map(
      availability!.priceOverrides.map((o) => [o.date, o.price])
    );
    const stayDates = eachDayOfInterval({
      start: selectedRange!.from!,
      end: selectedRange!.to!,
    });
    heroNights = stayDates.length;
    heroTotal = stayDates.reduce((sum, date) => {
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
          style={{ fontFamily: "var(--font-blisey), serif", transform: splashTransform || undefined }}
        >
          Stay in Venice Beach
        </h1>
      </div>

      {/* Show all photos - fixed upper right */}
      <button
        onClick={() => setShowAllPhotos(true)}
        className={`fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3 sm:px-4 py-2 backdrop-blur-sm border rounded-lg text-white text-sm font-medium transition-colors ${
          pastCarousel
            ? "bg-black/80 border-black/60 hover:bg-black/90"
            : "bg-white/20 border-white/40 hover:bg-white/30"
        }`}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="hidden sm:inline">Show all photos</span>
        <span className="sm:hidden">Photos</span>
      </button>

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
        className={`relative z-10 flex flex-col items-center px-4 mb-[-120px] transition-opacity duration-500 ${layoutReady ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: `translateY(-${fixedTranslateY !== null ? `${fixedTranslateY}px` : '50%'})` }}
      >
        <div
          ref={titleRef}
          className="text-center text-white px-8 py-6 mb-4 rounded-2xl bg-gradient-to-br from-amber-900/60 via-stone-900/50 to-stone-800/40 backdrop-blur-sm"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            maskComposite: "intersect",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent), linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskComposite: "destination-in",
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent" style={{ fontFamily: "var(--font-blisey), serif" }}>
            Stay in Venice Beach
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md text-stone-100">
            Select from available dates below
          </p>
        </div>
        <div ref={calendarRef} className={`relative transition-all duration-500 ease-in-out ${hasRange && canFitSideButton ? "mr-[140px]" : "mr-0"}`}>
          {/* Calendar nav arrows — outside the white box, at the hero/content boundary */}
          <button
            onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
            className="absolute -left-6 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-amber-700 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            style={{ top: arrowTopOffset ?? 0 }}
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
            className="absolute -right-6 -translate-y-1/2 z-10 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-amber-700 shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            style={{ top: arrowTopOffset ?? 0 }}
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div
            className="bg-white rounded-xl shadow-xl px-6 pt-4 pb-8"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest("button, .rdp-day, .rdp-nav, svg")) {
                setSelectedRange(undefined);
              }
            }}
          >
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
                onSelect={setSelectedRange}
                numberOfMonths={isMobile ? 1 : 2}
                showOutsideDays={false}
                disabled={(date) => {
                  const today = startOfDay(new Date());
                  if (isBefore(date, today)) return true;
                  const dateStr = date.toISOString().split("T")[0];
                  if (new Set(availability.blockedDates).has(dateStr)) return true;
                  if (availability.availableDateRanges.length === 0) return true;
                  return !availability.availableDateRanges.some((range) =>
                    isWithinInterval(date, {
                      start: parseISO(range.from),
                      end: parseISO(range.to),
                    })
                  );
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
                  day_disabled: "text-stone-300 opacity-50 cursor-not-allowed",
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
          <div
            ref={sideButtonRef}
            className={`absolute left-full -translate-y-1/2 ml-10 flex flex-col items-center gap-3 transition-all duration-500 ease-in-out ${
              hasRange && canFitSideButton ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ top: arrowTopOffset ?? 0 }}
          >
            <button
              onClick={() =>
                document
                  .getElementById("booking")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-amber-700 text-white px-6 py-4 rounded-lg shadow-lg hover:bg-amber-800 transition-colors flex flex-col items-center gap-1 whitespace-nowrap"
            >
              <span className="text-2xl font-bold">${heroTotal.toFixed(0)}</span>
              <span className="text-sm opacity-80">
                {heroNights} night{heroNights !== 1 ? "s" : ""}
              </span>
              <div className="flex flex-col items-center -space-y-2 mt-1">
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <svg className="w-5 h-5 animate-bounce [animation-delay:150ms]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
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
              This is my full-time home that I&apos;m opening up for short-term stays.
              You&apos;ll be living in a real, lived-in Venice apartment &mdash; not a
              sterile rental. You&apos;ll find my vinyl record collection, music
              equipment, and personal belongings throughout the space. I ask that
              guests treat everything with care and respect.
            </p>
            <p>
              The apartment features a fully equipped kitchen, comfortable bedroom,
              a private patio with outdoor couch, and plenty of houseplants (all
              self-watering, so no care needed). There&apos;s also a community BBQ area
              and apartment gym just steps from the front door.
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
            Check Availability &amp; Book
          </h2>

          {loading ? (
            <p className="text-stone-500">Loading availability...</p>
          ) : availability ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="text-stone-500 mb-4">
                  Select your check-in and check-out dates:
                </p>
                <BookingCalendar
                  availability={availability}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                />
                {availability.dailyRate && (
                  <p className="text-center text-stone-500 mt-3 text-sm">
                    Starting from ${availability.dailyRate} / night
                  </p>
                )}
              </div>
              <div>
                {selectedRange?.from && selectedRange?.to ? (
                  <BookingForm
                    selectedRange={selectedRange}
                    dailyRate={availability.dailyRate}
                    priceOverrides={availability.priceOverrides}
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

      {/* Fixed bottom-right scroll button for narrow viewports */}
      <button
        onClick={() =>
          document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })
        }
        className={`fixed bottom-[80px] left-1/2 -translate-x-1/2 z-40 bg-amber-700 text-white rounded-full shadow-lg hover:bg-amber-800 transition-all duration-300 flex items-center gap-2 px-4 py-3 ${
          hasRange && (!canFitSideButton || !sideButtonVisible) && !bookingSectionVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-4"
        }`}
      >
        <span className="text-sm font-bold">${heroTotal.toFixed(0)}</span>
        <span className="text-xs opacity-80">{heroNights} night{heroNights !== 1 ? "s" : ""}</span>
        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Fixed contact bar */}
      <div className="fixed bottom-3 left-4 right-4 z-50 bg-stone-900/95 backdrop-blur-sm border border-stone-700/50 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://instagram.com/hsuregan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="hidden sm:inline">Instagram</span>
          </a>
          <a
            href="mailto:hsuregan@gmail.com"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-600 text-white text-sm font-medium hover:bg-stone-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span className="hidden sm:inline">Email</span>
          </a>
          <a
            href="tel:+15125176805"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-700 border border-stone-500 text-stone-200 text-sm font-medium hover:bg-stone-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            <span className="hidden sm:inline">(512) 517-6805</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-400 py-8 pb-20 text-center text-sm">
        <p>Venice Short-Term Rental &middot; Direct Booking</p>
      </footer>

      <PhotoDialog open={showAllPhotos} onClose={() => setShowAllPhotos(false)} />
      <PhotoDialog open={heroLightboxIndex !== null} onClose={() => setHeroLightboxIndex(null)} initialIndex={heroLightboxIndex} />
    </main>
  );
}
