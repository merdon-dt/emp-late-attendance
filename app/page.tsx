import { getEmployees } from "@/app/actions/employee";
import { getTodayAttendance } from "@/app/actions/attendance";
import { getTodayCleaningRecords } from "@/app/actions/cleaner";
import { Temporal } from "temporal-polyfill";
import { Users, UserCheck, Clock, ShieldCheck, SprayCan, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [employees, attendance, cleaningRecords] = await Promise.all([
    getEmployees(),
    getTodayAttendance(),
    getTodayCleaningRecords(),
  ]);

  const activeEmployees = employees.filter(e => e.isActive);
  const totalActive = activeEmployees.length;

  const activeRegular = activeEmployees.filter(e => e.type === "REGULAR");
  
  let lateToday = 0;
  let totalLateMinutesToday = 0;
  
  const lateRecords = [];

  for (const a of attendance) {
    if (!activeRegular.some(e => e.id === a.employeeId)) continue;
    
    if (a.checkIn) {
      const checkInZdt = Temporal.Instant.from(a.checkIn).toZonedDateTimeISO("Asia/Kolkata");
      const threshold = checkInZdt.withPlainTime("09:50");
      const diffInMs = checkInZdt.epochMilliseconds - threshold.epochMilliseconds;
      
      let dayLateMins = 0;
      if (diffInMs > 0) {
        dayLateMins += Math.floor(diffInMs / 60000);
      }
      


      if (dayLateMins > 0) {
        lateToday++;
        totalLateMinutesToday += dayLateMins;
        lateRecords.push({ record: a, lateMins: dayLateMins, emp: activeRegular.find(e => e.id === a.employeeId) });
      }
    }
  }

  const onTimeToday = activeRegular.length - lateToday;

  const activeCleaners = activeEmployees.filter(e => e.type === "CLEANER").length;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Late Attendance Dashboard
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Today&apos;s snapshot for {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Users size={80} /></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
            <h3 className="text-sm font-semibold text-gray-600">Total Employees</h3>
          </div>
          <p className="mt-4 text-4xl font-bold text-gray-900 tracking-tight">{totalActive}</p>
        </div>
        
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Clock size={80} /></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
            <h3 className="text-sm font-semibold text-gray-600">Late Check-Ins</h3>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900 tracking-tight">{lateToday}</p>
            <p className="text-sm font-medium text-gray-500">/ {activeRegular.length}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><AlertCircle size={80} /></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
            <h3 className="text-sm font-semibold text-gray-600">Total Late Mins Today</h3>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-red-600 tracking-tight">{totalLateMinutesToday}</p>
            <p className="text-sm font-medium text-gray-500">mins</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><UserCheck size={80} /></div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><UserCheck size={20} /></div>
            <h3 className="text-sm font-semibold text-gray-600">On Time Today</h3>
          </div>
          <p className="mt-4 text-4xl font-bold text-gray-900 tracking-tight">{onTimeToday}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Attendance Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
          <div className="border-b border-gray-100 bg-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" size={18} />
              Late Staff Today
            </h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{lateRecords.length} Late</span>
          </div>
          <div className="flex-1 overflow-x-auto p-4">
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Employee</th>
                    <th className="px-5 py-3.5 font-semibold">Check In</th>
                    <th className="px-5 py-3.5 font-semibold">Check Out</th>
                    <th className="px-5 py-3.5 font-semibold">Total Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {lateRecords.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">Everyone is on time today! 🎉</td></tr>
                  ) : lateRecords.map(({ emp, record, lateMins }) => {
                    const checkInStr = record?.checkIn ? Temporal.Instant.from(record.checkIn).toZonedDateTimeISO("Asia/Kolkata").toPlainTime().toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : "—";
                    const checkOutStr = record?.checkOut ? Temporal.Instant.from(record.checkOut).toZonedDateTimeISO("Asia/Kolkata").toPlainTime().toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : "—";
  
                    return (
                      <tr key={emp?.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900">{emp?.name}</td>
                        <td className="px-5 py-4 text-gray-600">{checkInStr}</td>
                        <td className="px-5 py-4 text-gray-600">{checkOutStr}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/50">
                            <AlertCircle size={12} /> {lateMins} mins
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Cleaner Summary Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
          <div className="border-b border-gray-100 bg-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <SprayCan className="text-teal-500" size={18} />
              Cleaning Staff Status
            </h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{activeCleaners} Total</span>
          </div>
          <div className="flex-1 overflow-x-auto p-4">
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Cleaner</th>
                    <th className="px-5 py-3.5 font-semibold">Came Today</th>
                    <th className="px-5 py-3.5 font-semibold">Cleaned Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {employees.filter(e => e.type === "CLEANER" && e.isActive).length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">No active cleaners found</td></tr>
                  ) : employees.filter(e => e.type === "CLEANER" && e.isActive).map(emp => {
                    const record = cleaningRecords.find(r => r.employeeId === emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900">{emp.name}</td>
                        <td className="px-5 py-4">
                          {record?.came ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Yes</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">No</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {record?.cleaned ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Yes</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
