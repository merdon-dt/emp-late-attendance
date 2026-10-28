"use client";

import { useState } from "react";
import { Temporal } from "temporal-polyfill";
import { checkIn, checkOut } from "@/app/actions/attendance";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Search,
  Filter,
} from "lucide-react";
import { ATTENDANCE_LATE_TIME } from "@/lib/date";

type Employee = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

type AttendanceRecord = {
  id: string;
  employeeId: string;
  checkIn: string | null;
  checkOut: string | null;
};

type EmployeeWithAttendance = Employee & {
  attendance: AttendanceRecord | null;
};

type HistoryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
};

export default function AttendanceClient({
  initialData,
  initialHistory,
}: {
  initialData: EmployeeWithAttendance[];
  initialHistory: HistoryRecord[];
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"TODAY" | "HISTORY">("TODAY");

  // Status computation for Today
  const getStatus = (record: AttendanceRecord | null) => {
    if (!record || !record.checkIn)
      return {
        label: "Assumed On Time",
        color: "bg-green-50 text-green-700 ring-green-600/20",
      };

    const checkInZdt = Temporal.Instant.from(record.checkIn).toZonedDateTimeISO(
      "Asia/Kolkata",
    );
    const threshold = checkInZdt.withPlainTime(ATTENDANCE_LATE_TIME);
    const diffInMs = checkInZdt.epochMilliseconds - threshold.epochMilliseconds;
    const lateMins = diffInMs > 0 ? Math.floor(diffInMs / 60000) : 0;
    const isLate = lateMins > 0;

    if (!isLate) {
      if (record.checkOut)
        return {
          label: "Completed (On Time)",
          color: "bg-green-50 text-green-700 ring-green-600/20",
        };
      return {
        label: "On Time (Recorded)",
        color: "bg-green-50 text-green-700 ring-green-600/20",
      };
    }

    if (record.checkOut)
      return {
        label: "Completed (Late)",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
      };
    return {
      label: "Late (Checked In)",
      color: "bg-amber-50 text-amber-700 ring-amber-600/20",
    };
  };

  const getLateDuration = (isoStr: string | null) => {
    if (!isoStr) return null;
    const checkInZdt =
      Temporal.Instant.from(isoStr).toZonedDateTimeISO("Asia/Kolkata");
    const threshold = checkInZdt.withPlainTime(ATTENDANCE_LATE_TIME);
    if (Temporal.ZonedDateTime.compare(checkInZdt, threshold) <= 0) return null;

    // Calculate difference
    const diff = checkInZdt.since(threshold);
    const totalMinutes = Math.floor(diff.total({ unit: "minute" }));
    return `${totalMinutes} min late`;
  };

  const handleCheckIn = async (employeeId: string) => {
    try {
      await checkIn(employeeId);
      setData((prev) =>
        prev.map((emp) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              attendance: {
                id: "temp-id",
                employeeId,
                checkIn: Temporal.Now.instant().toString(),
                checkOut: null,
              },
            };
          }
          return emp;
        }),
      );
      toast.success("Successfully checked in");
    } catch {
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      const result = await checkOut(employeeId);
      setData((prev) =>
        prev.map((emp) => {
          if (emp.id === employeeId && emp.attendance) {
            return {
              ...emp,
              attendance: {
                ...emp.attendance,
                checkOut: result.checkOut,
              },
            };
          }
          return emp;
        }),
      );
      toast.success("Successfully checked out");
    } catch {
      toast.error("Failed to check out");
    }
  };

  const formatTime = (isoStr: string | null) => {
    if (!isoStr) return "—";
    const instant = Temporal.Instant.from(isoStr);
    return instant
      .toZonedDateTimeISO("Asia/Kolkata")
      .toPlainTime()
      .toLocaleString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
  };

  const onTimeCount = data.filter((e) => {
    if (!e.attendance?.checkIn) return true; // Assumed on time
    const checkInZdt = Temporal.Instant.from(
      e.attendance.checkIn,
    ).toZonedDateTimeISO("Asia/Kolkata");
    const threshold = checkInZdt.withPlainTime(ATTENDANCE_LATE_TIME);
    const diffInMs = checkInZdt.epochMilliseconds - threshold.epochMilliseconds;
    const lateMins = diffInMs > 0 ? Math.floor(diffInMs / 60000) : 0;
    return lateMins === 0;
  }).length;

  const lateCount = data.filter((e) => {
    if (!e.attendance?.checkIn) return false;
    const checkInZdt = Temporal.Instant.from(
      e.attendance.checkIn,
    ).toZonedDateTimeISO("Asia/Kolkata");
    const threshold = checkInZdt.withPlainTime(ATTENDANCE_LATE_TIME);
    const diffInMs = checkInZdt.epochMilliseconds - threshold.epochMilliseconds;
    const lateMins = diffInMs > 0 ? Math.floor(diffInMs / 60000) : 0;
    return lateMins > 0;
  }).length;
  const checkedOutCount = data.filter((e) => e.attendance?.checkOut).length;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Late Attendance Tracker
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Record and manage employees who arrived late.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("TODAY")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "TODAY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Today&apos;s Late Tracker
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "HISTORY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            History View
          </button>
        </nav>
      </div>

      {activeTab === "TODAY" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-500">
                  Total Staff
                </h3>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <h3 className="text-sm font-semibold text-gray-500">
                  On Time (Assumed)
                </h3>
              </div>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {onTimeCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-500">
                  Late Staff
                </h3>
              </div>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {lateCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-500">
                  Checked Out
                </h3>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {checkedOutCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">Check In</th>
                    <th className="px-6 py-3 font-medium">Check Out</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((emp) => {
                    const status = getStatus(emp.attendance);
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(emp.attendance?.checkIn ?? null)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(emp.attendance?.checkOut ?? null)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!emp.attendance?.checkIn && (
                            <button
                              onClick={() => handleCheckIn(emp.id)}
                              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
                            >
                              Check In
                            </button>
                          )}
                          {emp.attendance?.checkIn &&
                            !emp.attendance?.checkOut && (
                              <button
                                onClick={() => handleCheckOut(emp.id)}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
                              >
                                Check Out
                              </button>
                            )}
                          {emp.attendance?.checkOut && (
                            <span className="text-xs font-medium text-gray-400">
                              —
                            </span>
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
      )}

      {activeTab === "HISTORY" && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-gray-100 bg-white p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search employee history..."
                className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter size={16} />
              Filter Month
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Check In</th>
                  <th className="px-6 py-3 font-medium">Check Out</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Late Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No historical records found.
                    </td>
                  </tr>
                ) : (
                  initialHistory.map((record) => {
                    let status = {
                      label: "On Time",
                      color: "bg-blue-50 text-blue-700 ring-blue-600/20",
                    };
                    const lateDuration = getLateDuration(record.checkIn);

                    if (lateDuration) {
                      status = {
                        label: "Late",
                        color: "bg-amber-50 text-amber-700 ring-amber-600/20",
                      };
                    }

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.employeeName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(record.checkIn)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(record.checkOut)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {lateDuration || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
