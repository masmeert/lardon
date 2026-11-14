import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { calendarDay } from "./calendar-day";

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function scheduleMidnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    timer = setTimeout(
      () => {
        onChange();
        scheduleMidnight();
      },
      midnight.getTime() - now.getTime() + 1000,
    );
  }

  scheduleMidnight();

  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") onChange();
  });

  return () => {
    clearTimeout(timer);
    subscription.remove();
  };
}

export function useToday() {
  return useSyncExternalStore(subscribe, () => calendarDay(new Date()));
}
