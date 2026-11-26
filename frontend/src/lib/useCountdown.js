import { useEffect, useState } from "react";

const pad = (num) => String(num).padStart(2, "0");

const compute = (startTime, endTime) => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  let label;
  let diff;
  if (now < start) {
    label = "Starts In:";
    diff = start - now;
  } else if (now < end) {
    label = "Ends In:";
    diff = end - now;
  } else {
    return { status: "ended", label: "", text: "Time's up!" };
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return {
    status: now < start ? "upcoming" : "live",
    label,
    text: `(${days} Days) ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
};

/** Ticks once per second and stops when the auction ends. */
export const useCountdown = (startTime, endTime) => {
  const [state, setState] = useState(() => compute(startTime, endTime));

  useEffect(() => {
    setState(compute(startTime, endTime));
    if (!startTime || !endTime) return undefined;
    const timer = setInterval(() => {
      const next = compute(startTime, endTime);
      setState(next);
      if (next.status === "ended") clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return state;
};
