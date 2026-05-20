"use client";

import { useState } from "react";
import type { DatabaseColumn, DatabaseRow } from "@notoflow/database-engine";
import { Button } from "@notoflow/ui/components/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarViewProps {
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  dateColumnId: string;
  onAddRow: (values: Record<string, unknown>) => void;
}

export function CalendarView({ columns, rows, dateColumnId, onAddRow }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Find title column
  const titleCol = columns.find((c) => c.type === "text") || columns[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: (Date | null)[] = [];

  // Padding days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  const startDayPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Align to Mon-Sun
  for (let i = startDayPadding - 1; i >= 0; i--) {
    daysGrid.push(new Date(year, month - 1, prevMonthDays - i));
  }

  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  // Padding days from next month to make grid multiple of 7
  const remainingCells = 42 - daysGrid.length;
  for (let d = 1; d <= remainingCells; d++) {
    daysGrid.push(new Date(year, month + 1, d));
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const getDayRows = (date: Date) => {
    const dStr = date.toISOString().split("T")[0];
    return rows.filter((row) => {
      const val = row.values[dateColumnId];
      if (!val) return false;
      return String(val).split("T")[0] === dStr;
    });
  };

  return (
    <div className="p-5 flex flex-col h-full bg-card/10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-foreground">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" onClick={handlePrevMonth} type="button">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-7 font-semibold"
            onClick={() => setCurrentDate(new Date())}
            type="button"
          >
            Aujourd&apos;hui
          </Button>
          <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleNextMonth} type="button">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Days Headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mer</div>
        <div>Jeu</div>
        <div>Ven</div>
        <div>Sam</div>
        <div>Dim</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 bg-border/20 p-1.5 rounded-xl border border-border/40">
        {daysGrid.map((date, idx) => {
          if (!date) return <div key={idx} className="bg-muted/10 rounded-lg min-h-[90px]" />;
          const isCurrentMonth = date.getMonth() === month;
          const dayRows = getDayRows(date);
          const formattedDate = date.toISOString().split("T")[0];

          return (
            <div
              key={idx}
              className={`rounded-lg p-2 min-h-[90px] flex flex-col justify-between border border-border/25 group relative transition-all duration-100 ${
                isCurrentMonth ? "bg-card/90" : "bg-muted/20 text-muted-foreground opacity-55"
              }`}
            >
              {/* Day Number and Plus icon */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                  {date.getDate()}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  onClick={() => onAddRow({ [dateColumnId]: formattedDate })}
                  type="button"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Items list */}
              <div className="flex-1 space-y-1 mt-1 overflow-y-auto max-h-[55px]">
                {dayRows.map((row) => {
                  const cardTitle = String(row.values[titleCol?.id] || "Sans nom");
                  return (
                    <div
                      key={row.id}
                      className="text-[9px] font-semibold truncate rounded bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 leading-none"
                      title={cardTitle}
                    >
                      {cardTitle}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
