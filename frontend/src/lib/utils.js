import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

/** "upcoming" | "live" | "ended" for an auction's start/end times. */
export const auctionStatus = (startTime, endTime, now = Date.now()) => {
  if (now < new Date(startTime).getTime()) return "upcoming";
  if (now < new Date(endTime).getTime()) return "live";
  return "ended";
};
