import { db } from "@/lib/db";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  const [employees, allAttendance, allCleaning] = await Promise.all([
    db.orm.public.Employee.all(),
    db.orm.public.Attendance.all(),
    db.orm.public.CleaningRecord.all(),
  ]);

  // Pass strings to client for dates
  const serializedAttendance = allAttendance.map((a) => ({
    ...a,
    checkIn: a.checkIn.toString(),
    checkOut: a.checkOut?.toString() || null,
  }));

  const serializedCleaning = allCleaning.map((c) => ({
    ...c,
    date: c.date.toString(),
  }));

  const serializedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    type: emp.type,
    isActive: emp.isActive,
  }));

  return (
    <ReportsClient
      employees={serializedEmployees as any}
      attendance={serializedAttendance}
      cleaning={serializedCleaning}
    />
  );
}
