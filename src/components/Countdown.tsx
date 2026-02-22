"use client";
import { useEffect, useState } from "react";
import { formatTimeRemaining, isPoolClosed, cn } from "@/lib/utils";

export function Countdown({ closesAt }: { closesAt: string }) {
  const [display, setDisplay] = useState(formatTimeRemaining(closesAt));
  const [closed, setClosed] = useState(isPoolClosed(closesAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(formatTimeRemaining(closesAt));
      setClosed(isPoolClosed(closesAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  const urgent = !closed && new Date(closesAt).getTime() - Date.now() < 3600000;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-mono",
      closed ? "bg-gray-100 text-gray-500" : urgent ? "bg-red-50 text-red-600 animate-pulse" : "bg-green-50 text-green-700"
    )}>
      {closed ? "🔒 Closed" : `⏱ ${display}`}
    </span>
  );
}
