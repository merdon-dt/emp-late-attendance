"use server";

import { db } from "@/lib/db";

import { Temporal } from "temporal-polyfill";
import { getTodayStart } from "@/lib/date";

export async function checkIn(employeeId: string) {
  const date = getTodayStart();

  const existing = await db.orm.public.Attendance.where({
    employeeId,
    date,
  }).all();

  if (existing.length > 0) {
    throw new Error("Employee already checked in today.");
  }

  const record = await db.orm.public.Attendance.create({
    employeeId,
    date,
    checkIn: Temporal.Now.instant(),
  });

  return {
    id: record.id,
    employeeId: record.employeeId,
    date: record.date.toString(),
    checkIn: record.checkIn ? record.checkIn.toString() : null,
    checkOut: record.checkOut ? record.checkOut.toString() : null,
  };
}

export async function checkOut(employeeId: string) {
  const date = getTodayStart();

  const attendance = await db.orm.public.Attendance.where({
    employeeId,
    date,
  }).all();

  const record = attendance[0];

  if (!record) {
    throw new Error("Employee has not checked in today.");
  }

  if (record.checkOut) {
    throw new Error("Employee already checked out.");
  }

  const updated = await db.orm.public.Attendance.where({
    employeeId,
    date,
  }).update({
    checkOut: date.toZonedDateTime("Asia/Kolkata").withPlainTime("18:45").toInstant(),
  });

  return {
    id: updated?.id,
    employeeId: updated?.employeeId,
    date: updated?.date.toString(),
    checkIn: updated?.checkIn ? updated?.checkIn.toString() : null,
    checkOut: updated?.checkOut ? updated?.checkOut.toString() : null,
  };
}

export async function getTodayAttendance() {
  const date = getTodayStart();

  const records = await db.orm.public.Attendance.where({
    date,
  }).all();

  return records.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    date: a.date.toString(),
    checkIn: a.checkIn ? a.checkIn.toString() : null,
    checkOut: a.checkOut ? a.checkOut.toString() : null,
  }));
}

export async function getAttendanceHistory() {
  const [attendance, employees] = await Promise.all([
    db.orm.public.Attendance.all(),
    db.orm.public.Employee.where({ type: "REGULAR" }).all(),
  ]);

  return attendance
    .map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      return {
        id: a.id,
        employeeId: a.employeeId,
        date: a.date.toString(),
        checkIn: a.checkIn ? a.checkIn.toString() : null,
        checkOut: a.checkOut ? a.checkOut.toString() : null,
        employeeName: emp?.name || "Unknown",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function updateAttendanceTimes(
  recordId: string,
  checkInInstantStr: string | null,
  checkOutInstantStr: string | null,
) {
  const updated = await db.orm.public.Attendance.where({ id: recordId }).update(
    {
      checkIn: checkInInstantStr
        ? Temporal.Instant.from(checkInInstantStr)
        : null,
      checkOut: checkOutInstantStr
        ? Temporal.Instant.from(checkOutInstantStr)
        : null,
    },
  );

  return {
    id: updated?.id,
    employeeId: updated?.employeeId,
    date: updated?.date.toString(),
    checkIn: updated?.checkIn ? updated?.checkIn.toString() : null,
    checkOut: updated?.checkOut ? updated?.checkOut.toString() : null,
  };
}

export async function addPastAttendance(
  employeeId: string,
  dateStr: string,
  checkInStr: string,
  checkOutStr: string
) {
  const date = Temporal.PlainDate.from(dateStr);
  const existing = await db.orm.public.Attendance.where({
    employeeId,
    date,
  }).all();

  if (existing.length > 0) {
    throw new Error("Attendance record already exists for this date.");
  }

  const checkInInstant = checkInStr 
    ? date.toZonedDateTime("Asia/Kolkata").withPlainTime(checkInStr).toInstant() 
    : null;
    
  const checkOutInstant = checkOutStr 
    ? date.toZonedDateTime("Asia/Kolkata").withPlainTime(checkOutStr).toInstant() 
    : null;

  const record = await db.orm.public.Attendance.create({
    employeeId,
    date,
    checkIn: checkInInstant,
    checkOut: checkOutInstant,
  });

  return {
    id: record.id,
    employeeId: record.employeeId,
    date: record.date.toString(),
    checkIn: record.checkIn ? record.checkIn.toString() : null,
    checkOut: record.checkOut ? record.checkOut.toString() : null,
  };
}
