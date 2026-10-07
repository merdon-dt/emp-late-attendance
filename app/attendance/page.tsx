import { getEmployees } from "@/app/actions/employee";
import { getTodayAttendance, getAttendanceHistory } from "@/app/actions/attendance";
import AttendanceClient from "./AttendanceClient";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const [employees, attendance, historyRecords] = await Promise.all([
    getEmployees(),
    getTodayAttendance(),
    getAttendanceHistory()
  ]);

  // We only want active regular employees for the attendance list
  const activeRegulars = employees.filter(e => e.isActive && e.type === "REGULAR");

  const initialData = activeRegulars.map(emp => {
    const record = attendance.find(a => a.employeeId === emp.id);
    return {
      id: emp.id,
      name: emp.name,
      type: emp.type,
      isActive: emp.isActive,
      attendance: record ? {
        id: record.id,
        employeeId: record.employeeId,
        checkIn: record.checkIn ? record.checkIn.toString() : null,
        checkOut: record.checkOut ? record.checkOut.toString() : null,
      } : null,
    };
  });

  const history = historyRecords.map(h => ({
    ...h,
    date: h.date.toString(),
    checkIn: h.checkIn ? h.checkIn.toString() : null,
    checkOut: h.checkOut ? h.checkOut.toString() : null,
  }));

  return (
    <AttendanceClient initialData={initialData} initialHistory={history} />
  );
}
