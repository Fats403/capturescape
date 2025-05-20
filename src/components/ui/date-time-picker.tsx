"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "./label";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  disabledDates?: (date: Date) => boolean;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Select date and time",
  disabledDates,
}: DateTimePickerProps) {
  // Generate options for hours, minutes, and AM/PM
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i === 0 ? "12" : i.toString(),
    label: i === 0 ? "12" : i.toString().padStart(2, "0"),
  }));

  // Simplified minute options with 5-minute intervals
  const minuteOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i * 5).toString(),
    label: (i * 5).toString().padStart(2, "0"),
  }));

  // Get current hour, minute, and period from the date
  const getHour = (date: Date | undefined) => {
    if (!date) return "12";
    const hour = date.getHours() % 12;
    return hour === 0 ? "12" : hour.toString();
  };

  const getMinute = (date: Date | undefined) => {
    if (!date) return "0";
    return date.getMinutes().toString();
  };

  const getPeriod = (date: Date | undefined) => {
    if (!date) return "AM";
    return date.getHours() >= 12 ? "PM" : "AM";
  };

  // Update date with new time values
  const updateDateTime = (
    currentDate: Date | undefined,
    hour: string,
    minute: string,
    period: "AM" | "PM",
  ) => {
    if (!currentDate) return;

    const newDate = new Date(currentDate);
    let hours = parseInt(hour);

    // Convert 12-hour to 24-hour
    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    newDate.setHours(hours, parseInt(minute), 0, 0);
    return newDate;
  };

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP h:mm a") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="space-y-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDates}
            initialFocus
          />
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <div className="grid gap-1 text-center">
                <Label htmlFor="hours" className="text-xs">
                  Hour
                </Label>
                <select
                  id="hours"
                  className="w-[60px] rounded-md border border-input bg-background p-2 text-sm"
                  value={getHour(date)}
                  onChange={(e) => {
                    const newDate = updateDateTime(
                      date ?? new Date(),
                      e.target.value,
                      getMinute(date),
                      getPeriod(date),
                    );
                    if (newDate) setDate(newDate);
                  }}
                >
                  {hourOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1 text-center">
                <Label htmlFor="minutes" className="text-xs">
                  Minute
                </Label>
                <select
                  id="minutes"
                  className="scrollbar-thin h-[38px] w-[60px] rounded-md border border-input bg-background p-2 text-sm"
                  value={getMinute(date)}
                  onChange={(e) => {
                    const newDate = updateDateTime(
                      date ?? new Date(),
                      getHour(date),
                      e.target.value,
                      getPeriod(date),
                    );
                    if (newDate) setDate(newDate);
                  }}
                  style={{ maxHeight: "38px", overflow: "auto" }}
                >
                  {minuteOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1 text-center">
                <Label htmlFor="period" className="text-xs">
                  Period
                </Label>
                <select
                  id="period"
                  className="w-[60px] rounded-md border border-input bg-background p-2 text-sm"
                  value={getPeriod(date)}
                  onChange={(e) => {
                    const newDate = updateDateTime(
                      date ?? new Date(),
                      getHour(date),
                      getMinute(date),
                      e.target.value as "AM" | "PM",
                    );
                    if (newDate) setDate(newDate);
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="flex h-10 items-center">
                <Clock className="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
