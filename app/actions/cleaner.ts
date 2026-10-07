"use server";

import { db } from "@/lib/db";
import { Temporal } from "temporal-polyfill";
import { getTodayStart } from "@/lib/date";

export async function getTodayCleaningRecords() {
  const date = getTodayStart();

  return db.orm.public.CleaningRecord.where({
    date,
  }).all();
}

export async function toggleCleanerState(
  employeeId: string, 
  field: "came" | "cleaned" | "onLeave", 
  value: boolean
) {
  const date = getTodayStart();

  const existing = await db.orm.public.CleaningRecord.where({
    employeeId,
    date,
  }).all();

  if (existing.length > 0) {
    return db.orm.public.CleaningRecord.where({
      id: existing[0].id,
    }).update({
      [field]: value,
    });
  }

  // Create new record for today if it doesn't exist yet
  return db.orm.public.CleaningRecord.create({
    employeeId,
    date,
    [field]: value,
  });
}

export async function getCleanerHistory() {
  const [records, employees] = await Promise.all([
    db.orm.public.CleaningRecord.all(),
    db.orm.public.Employee.where({ type: "CLEANER" }).all(),
  ]);

  return records.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    return {
      ...r,
      employeeName: emp?.name || "Unknown",
    };
  }).sort((a, b) => b.date.toString().localeCompare(a.date.toString()));
}

export async function updateCleanerRecord(id: string, came: boolean, cleaned: boolean, onLeave: boolean) {
  return db.orm.public.CleaningRecord.where({ id }).update({
    came,
    cleaned,
    onLeave,
  });
}

export async function addPastCleanerRecord(employeeId: string, date: string, came: boolean, cleaned: boolean, onLeave: boolean) {
  const plainDate = Temporal.PlainDate.from(date);

  // Check if record already exists for this date
  const existing = await db.orm.public.CleaningRecord.where({
    employeeId,
    date: plainDate,
  }).all();

  if (existing.length > 0) {
    throw new Error("A record for this date already exists");
  }

  return db.orm.public.CleaningRecord.create({
    employeeId,
    date: plainDate,
    came,
    cleaned,
    onLeave,
  });
}
