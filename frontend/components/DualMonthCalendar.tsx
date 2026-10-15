"use client";

import { useState } from "react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  isAfter,
  startOfToday,
  differenceInCalendarDays,
  isSameMonth
} from "date-fns";
import { ChevronLeft, ChevronRight, Keyboard } from "lucide-react";

interface DualMonthCalendarProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onSelectDates: (checkIn: Date | null, checkOut: Date | null) => void;
  hotelLocation?: string;
  minDate?: Date;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function DualMonthCalendar({
  checkIn,
  checkOut,
  onSelectDates,
  hotelLocation = "Dapoli",
  minDate = startOfToday(),
}: DualMonthCalendarProps) {
  // Start navigation month from checkIn or today
  const [baseMonth, setBaseMonth] = useState<Date>(() => {
    return startOfMonth(checkIn || minDate);
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const nextMonth = addMonths(baseMonth, 1);
  const isPrevDisabled = isBefore(baseMonth, startOfMonth(minDate));

  const handlePrevMonth = () => {
    if (!isPrevDisabled) {
      setBaseMonth((prev) => subMonths(prev, 1));
    }
  };

  const handleNextMonth = () => {
    setBaseMonth((prev) => addMonths(prev, 1));
  };

  const handleDateClick = (day: Date) => {
    if (isBefore(day, minDate)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // First click: select checkIn, reset checkOut
      onSelectDates(day, null);
    } else if (checkIn && !checkOut) {
      if (isBefore(day, checkIn)) {
        // Clicked a date before current checkIn -> becomes new checkIn
        onSelectDates(day, null);
      } else if (isSameDay(day, checkIn)) {
        // Clicked same day -> keep or reset
        onSelectDates(day, null);
      } else {
        // Second click: select checkOut
        onSelectDates(checkIn, day);
      }
    }
  };

  const handleClear = () => {
    onSelectDates(null, null);
    setHoverDate(null);
  };

  // Header Title & Subtitle calculation
  let headerTitle = "Select check-in date";
  let headerSubtitle = "Add your travel dates for exact pricing";

  if (checkIn && !checkOut) {
    headerTitle = "Select checkout date";
    headerSubtitle = `Check-in: ${format(checkIn, "MMM d, yyyy")}. Minimum stay: 1 night`;
  } else if (checkIn && checkOut) {
    const nights = differenceInCalendarDays(checkOut, checkIn);
    headerTitle = `${nights} ${nights === 1 ? "night" : "nights"} in ${hotelLocation}`;
    headerSubtitle = `${format(checkIn, "MMM d, yyyy")} – ${format(checkOut, "MMM d, yyyy")}`;
  }

  const renderMonthDays = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart); // 0 (Sun) to 6 (Sat)

    return (
      <div className="w-full">
        {/* Month Name & Year */}
        <div className="text-center font-bold text-base text-slate-900 mb-4">
          {format(monthDate, "MMMM yyyy")}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {WEEKDAYS.map((wd, i) => (
            <span
              key={i}
              className="text-xs font-semibold text-slate-500 py-1"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty spacer cells before 1st day of month */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10" />
          ))}

          {daysInMonth.map((day) => {
            const isPast = isBefore(day, minDate);
            const isCheckInDay = checkIn && isSameDay(day, checkIn);
            const isCheckOutDay = checkOut && isSameDay(day, checkOut);

            // Active or prospective in-range state
            const targetEndDate = checkOut || (checkIn && hoverDate && isAfter(hoverDate, checkIn) ? hoverDate : null);
            const isInRange =
              checkIn &&
              targetEndDate &&
              isAfter(day, checkIn) &&
              isBefore(day, targetEndDate);

            const isHoverTarget = hoverDate && isSameDay(day, hoverDate) && checkIn && !checkOut && isAfter(day, checkIn);

            return (
              <div
                key={day.toISOString()}
                className={`relative h-10 flex items-center justify-center ${
                  isInRange ? "bg-slate-100" : ""
                } ${
                  isCheckInDay && targetEndDate
                    ? "rounded-l-full bg-slate-100"
                    : ""
                } ${
                  (isCheckOutDay || isHoverTarget) && checkIn
                    ? "rounded-r-full bg-slate-100"
                    : ""
                }`}
                onMouseEnter={() => {
                  if (checkIn && !checkOut && !isPast) {
                    setHoverDate(day);
                  }
                }}
              >
                <button
                  type="button"
                  disabled={Boolean(isPast)}
                  onClick={() => handleDateClick(day)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    isPast
                      ? "text-slate-300 line-through cursor-not-allowed"
                      : isCheckInDay || isCheckOutDay
                      ? "bg-slate-900 text-white font-bold ring-2 ring-slate-900 shadow-md z-10"
                      : isHoverTarget
                      ? "bg-slate-800 text-white font-bold z-10"
                      : "text-slate-800 hover:border hover:border-slate-900 hover:font-bold"
                  }`}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {headerTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {headerSubtitle}
          </p>
        </div>

        {/* Prev / Next Month Arrows */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-slate-700"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-400 flex items-center justify-center transition-colors text-slate-700"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side-by-side Dual Month Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {renderMonthDays(baseMonth)}
        {renderMonthDays(nextMonth)}
      </div>

      {/* Footer Bar: Keyboard indicator & Clear dates */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px]">Click a date to set check-in, then click checkout date</span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="font-bold text-slate-900 hover:underline transition-all text-xs"
        >
          Clear dates
        </button>
      </div>
    </div>
  );
}
