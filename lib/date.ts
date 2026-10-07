import { Temporal } from "temporal-polyfill";

export function getTodayStart() {
  return Temporal.Now.zonedDateTimeISO("Asia/Kolkata").toPlainDate();
}
