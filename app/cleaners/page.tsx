import { getEmployees } from "@/app/actions/employee";
import { getTodayCleaningRecords, getCleanerHistory } from "@/app/actions/cleaner";
import CleanerClient from "./CleanerClient";

export const dynamic = "force-dynamic";

export default async function CleanersPage() {
  const [employees, records, historyRecords] = await Promise.all([
    getEmployees(),
    getTodayCleaningRecords(),
    getCleanerHistory()
  ]);

  // We only want active cleaners
  const activeCleaners = employees.filter(e => e.isActive && e.type === "CLEANER");

  const initialData = activeCleaners.map(emp => {
    const record = records.find(r => r.employeeId === emp.id);
    return {
      id: emp.id,
      name: emp.name,
      type: emp.type,
      isActive: emp.isActive,
      record: record ? {
        id: record.id,
        employeeId: record.employeeId,
        came: record.came,
        cleaned: record.cleaned,
      } : null,
    };
  });

  const history = historyRecords.map(h => ({
    ...h,
    date: h.date.toString()
  }));

  return (
    <CleanerClient initialData={initialData} initialHistory={history} />
  );
}
