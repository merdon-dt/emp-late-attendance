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
    id: a.id,
    employeeId: a.employeeId,
    date: a.date.toString(),
    checkIn: a.checkIn ? a.checkIn.toString() : "",
    checkOut: a.checkOut ? a.checkOut.toString() : null,
  }));

  const serializedCleaning = allCleaning.map((c) => ({
    id: c.id,
    employeeId: c.employeeId,
    date: c.date.toString(),
    came: c.came,
    cleaned: c.cleaned,
    onLeave: c.onLeave,
    officeLeave: c.officeLeave ?? false,
    grannyLeave: c.grannyLeave ?? false,
    comment: c.comment ?? null,
  }));

  const serializedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    type: emp.type,
    isActive: emp.isActive,
  }));

  return (
    <ReportsClient
      employees={serializedEmployees}
      attendance={serializedAttendance}
      cleaning={serializedCleaning}
    />
  );
}
