"use server";

import { db } from "@/lib/db";
import { Temporal } from "temporal-polyfill";
import { getTodayStart } from "@/lib/date";

export async function getTodayCleaningRecords() {
  const date = getTodayStart();

  const records = await db.orm.public.CleaningRecord.where({
    date,
  }).all();

  return records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    date: r.date.toString(),
    came: r.came,
    cleaned: r.cleaned,
    onLeave: r.onLeave,
    officeLeave: r.officeLeave ?? false,
    grannyLeave: r.grannyLeave ?? false,
    comment: r.comment ?? null,
  }));
}

export async function setCleanerDailyStatus(
  employeeId: string,
  updates: {
    came?: boolean;
    cleaned?: boolean;
    onLeave?: boolean;
    officeLeave?: boolean;
    grannyLeave?: boolean;
    comment?: string | null;
  }
) {
  const date = getTodayStart();

  const existing = await db.orm.public.CleaningRecord.where({
    employeeId,
    date,
  }).all();

  if (existing.length > 0) {
    const updated = await db.orm.public.CleaningRecord.where({
      id: existing[0].id,
    }).update(updates);
    return {
      id: updated?.id,
      employeeId: updated?.employeeId,
      date: updated?.date.toString(),
      came: updated?.came,
      cleaned: updated?.cleaned,
      onLeave: updated?.onLeave,
      officeLeave: updated?.officeLeave ?? false,
      grannyLeave: updated?.grannyLeave ?? false,
      comment: updated?.comment ?? null,
    };
  }

  // Create new record for today if it doesn't exist yet
  const created = await db.orm.public.CleaningRecord.create({
    employeeId,
    date,
    came: updates.came ?? false,
    cleaned: updates.cleaned ?? false,
    onLeave: updates.onLeave ?? false,
    officeLeave: updates.officeLeave ?? false,
    grannyLeave: updates.grannyLeave ?? false,
    comment: updates.comment ?? null,
  });

  return {
    id: created.id,
    employeeId: created.employeeId,
    date: created.date.toString(),
    came: created.came,
    cleaned: created.cleaned,
    onLeave: created.onLeave,
    officeLeave: created.officeLeave ?? false,
    grannyLeave: created.grannyLeave ?? false,
    comment: created.comment ?? null,
  };
}

export async function toggleCleanerState(
  employeeId: string,
  field: "came" | "cleaned" | "onLeave" | "officeLeave" | "grannyLeave",
  value: boolean
) {
  return setCleanerDailyStatus(employeeId, { [field]: value });
}

export async function getCleanerHistory() {
  const [records, employees] = await Promise.all([
    db.orm.public.CleaningRecord.all(),
    db.orm.public.Employee.where({ type: "CLEANER" }).all(),
  ]);

  return records
    .map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: emp?.name || "Unknown",
        date: r.date.toString(),
        came: r.came,
        cleaned: r.cleaned,
        onLeave: r.onLeave,
        officeLeave: r.officeLeave ?? false,
        grannyLeave: r.grannyLeave ?? false,
        comment: r.comment ?? null,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function updateCleanerRecord(
  id: string,
  data: {
    came: boolean;
    cleaned: boolean;
    onLeave: boolean;
    officeLeave?: boolean;
    grannyLeave?: boolean;
    comment?: string | null;
  }
) {
  const updated = await db.orm.public.CleaningRecord.where({ id }).update({
    came: data.came,
    cleaned: data.cleaned,
    onLeave: data.onLeave,
    officeLeave: data.officeLeave ?? false,
    grannyLeave: data.grannyLeave ?? false,
    comment: data.comment ?? null,
  });

  return {
    id: updated?.id,
    employeeId: updated?.employeeId,
    date: updated?.date.toString(),
    came: updated?.came,
    cleaned: updated?.cleaned,
    onLeave: updated?.onLeave,
    officeLeave: updated?.officeLeave ?? false,
    grannyLeave: updated?.grannyLeave ?? false,
    comment: updated?.comment ?? null,
  };
}

export async function addPastCleanerRecord(
  employeeId: string,
  date: string,
  data: {
    came: boolean;
    cleaned: boolean;
    onLeave: boolean;
    officeLeave?: boolean;
    grannyLeave?: boolean;
    comment?: string | null;
  }
) {
  const plainDate = Temporal.PlainDate.from(date);

  // Check if record already exists for this date
  const existing = await db.orm.public.CleaningRecord.where({
    employeeId,
    date: plainDate,
  }).all();

  if (existing.length > 0) {
    throw new Error("A record for this date already exists");
  }

  const record = await db.orm.public.CleaningRecord.create({
    employeeId,
    date: plainDate,
    came: data.came,
    cleaned: data.cleaned,
    onLeave: data.onLeave,
    officeLeave: data.officeLeave ?? false,
    grannyLeave: data.grannyLeave ?? false,
    comment: data.comment ?? null,
  });

  return {
    id: record.id,
    employeeId: record.employeeId,
    date: record.date.toString(),
    came: record.came,
    cleaned: record.cleaned,
    onLeave: record.onLeave,
    officeLeave: record.officeLeave ?? false,
    grannyLeave: record.grannyLeave ?? false,
    comment: record.comment ?? null,
  };
}
