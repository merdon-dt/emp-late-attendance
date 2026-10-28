import { Temporal } from "temporal-polyfill";

export function getTodayStart() {
  return Temporal.Now.zonedDateTimeISO("Asia/Kolkata").toPlainDate();
}

export const ATTENDANCE_LATE_TIME = "09:45";
