"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function AppearanceForm() {
  const [theme, setTheme] = useState("light");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label>Theme</Label>
        <p className="text-sm text-muted-foreground">
          Select the theme for the dashboard.
        </p>
        <RadioGroup className="grid max-w-md grid-cols-2 gap-8 pt-2">
          <div>
            <RadioGroupItem value="light" id="light" className="sr-only" />
            <Label htmlFor="light" onMouseDown={() => setTheme("light")}>
              <div className="items-center rounded-md border-2 border-primary bg-popover p-1 hover:border-primary/60 hover:bg-accent hover:text-accent-foreground dark:border-muted dark:hover:border-primary">
                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                  </div>
                </div>
              </div>
              <span className="block w-full p-2 text-center font-normal">
                Light
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="dark" id="dark" className="sr-only" />
            <Label htmlFor="dark" onMouseDown={() => setTheme("dark")}>
              <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-primary/60 hover:bg-accent hover:text-accent-foreground dark:border-primary dark:hover:border-primary">
                <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                  <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                  </div>
                </div>
              </div>
              <span className="block w-full p-2 text-center font-normal">
                Dark
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
