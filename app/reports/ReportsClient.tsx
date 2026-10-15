"use client";

import { useState, useMemo } from "react";
import { Temporal } from "temporal-polyfill";
import { Download } from "lucide-react";
import React from "react";

type Employee = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
};

type Cleaning = {
  id: string;
  employeeId: string;
  date: string;
  came: boolean;
  cleaned: boolean;
};

export default function ReportsClient({
  employees,
  attendance,
  cleaning,
}: {
  employees: Employee[];
  attendance: Attendance[];
  cleaning: Cleaning[];
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = Temporal.Now.plainDateISO();
    return `${today.year}-${today.month.toString().padStart(2, "0")}`;
  });

  const [activeTab, setActiveTab] = useState<"EMPLOYEE" | "CLEANER">(
    "EMPLOYEE",
  );

  // Get days in month
  const { year, month } = useMemo(() => {
    const [y, m] = selectedMonth.split("-");
    return { year: parseInt(y, 10), month: parseInt(m, 10) };
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    try {
      const date = Temporal.PlainYearMonth.from({ year, month });
      return date.daysInMonth;
    } catch {
      return 31;
    }
  }, [year, month]);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Is a specific day in the past or today? (for determining absent vs just future)
  const todayDate = Temporal.Now.plainDateISO();
  const getIsPastOrToday = (day: number) => {
    try {
      const date = Temporal.PlainDate.from({ year, month, day });
      return Temporal.PlainDate.compare(date, todayDate) <= 0;
    } catch {
      return false;
    }
  };

  const activeEmployees = employees.filter(
    (e) => e.isActive && e.type !== "CLEANER",
  );
  const activeCleaners = employees.filter(
    (e) => e.isActive && e.type === "CLEANER",
  );
  console.log({ activeEmployees, attendance });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Overall Report
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Excel-style monthly attendance grid.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 shadow-sm transition-all"
          >
            <Download size={16} /> Print / PDF
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("EMPLOYEE")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "EMPLOYEE"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab("CLEANER")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === "CLEANER"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Cleaners
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold min-w-[140px] sticky left-0 bg-gray-50/80 border-r border-gray-200 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                  Name
                </th>
                {daysArray.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-3 font-medium text-center min-w-[36px] border-r border-gray-100"
                  >
                    {day}
                  </th>
                ))}

                {activeTab === "EMPLOYEE" ? (
                  <>
                    <th className="px-3 py-3 font-semibold text-center bg-gray-50/80 border-l border-gray-200 z-10 text-amber-700 min-w-[70px]">
                      Late Days
                    </th>
                    <th className="px-3 py-3 font-semibold text-center bg-gray-50/80 border-l border-gray-200 z-10 text-orange-700 min-w-[80px]">
                      Total Late Mins
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 font-semibold text-center bg-gray-50/80 border-l border-gray-200 z-10 text-green-700">
                      P
                    </th>
                    <th className="px-3 py-3 font-semibold text-center bg-gray-50/80 z-10 text-red-700">
                      A
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === "EMPLOYEE" ? (
                activeEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 3}
                      className="p-8 text-center text-gray-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  activeEmployees.map((emp) => {
                    let totalLateMins = 0;
                    let lateDaysCount = 0;

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                          {emp.name}
                        </td>
                        {daysArray.map((day) => {
                          const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                          const record = attendance.find(
                            (a) =>
                              a.employeeId === emp.id && a.date === dateStr,
                          );

                          let display = "-";
                          let cellClass = "text-gray-300";

                          if (record?.checkIn) {
                            try {
                              const zdtIn = Temporal.Instant.from(
                                record.checkIn,
                              ).toZonedDateTimeISO("Asia/Kolkata");
                              const cutoff = zdtIn.withPlainTime("09:50");
                              const diffMs =
                                zdtIn.epochMilliseconds -
                                cutoff.epochMilliseconds;

                              if (diffMs > 0) {
                                const lateMins = Math.floor(diffMs / 60000);
                                display = `${lateMins}m`;
                                cellClass =
                                  "bg-orange-50 text-orange-700 font-bold";
                                totalLateMins += lateMins;
                                lateDaysCount += 1;
                              } else {
                                display = "✓";
                                cellClass = "text-green-500 font-bold";
                              }
                            } catch {
                              // ignore invalid date strings
                            }
                          }

                          return (
                            <td
                              key={day}
                              className={`px-1 py-2 text-center border-r border-gray-100 ${cellClass}`}
                            >
                              {display}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-bold text-amber-700 bg-amber-50/30 border-l border-gray-200">
                          {lateDaysCount}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-orange-700 bg-orange-50/30 border-l border-gray-200">
                          {totalLateMins}m
                        </td>
                      </tr>
                    );
                  })
                )
              ) : activeCleaners.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 3}
                    className="p-8 text-center text-gray-500"
                  >
                    No cleaners found.
                  </td>
                </tr>
              ) : (
                activeCleaners.map((emp) => {
                  let totalP = 0;
                  let totalA = 0;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                        {emp.name}
                      </td>
                      {daysArray.map((day) => {
                        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                        const record = cleaning.find(
                          (a) => a.employeeId === emp.id && a.date === dateStr,
                        );

                        let status = "";
                        let cellClass = "";

                        if (record) {
                          if (record.came) {
                            status = record.cleaned ? "C" : "P"; // Came and cleaned vs just came
                            cellClass = record.cleaned
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "bg-green-50 text-green-700 font-bold";
                            totalP++;
                          } else {
                            status = "A";
                            cellClass = "bg-red-50 text-red-700 font-bold";
                            totalA++;
                          }
                        } else {
                          if (getIsPastOrToday(day)) {
                            status = "A";
                            cellClass = "bg-red-50 text-red-700 font-bold";
                            totalA++;
                          }
                        }

                        return (
                          <td
                            key={day}
                            className={`px-1 py-2 text-center border-r border-gray-100 ${cellClass}`}
                            title={
                              status === "C"
                                ? "Came & Cleaned"
                                : status === "P"
                                  ? "Came, not cleaned"
                                  : ""
                            }
                          >
                            {status}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-bold text-green-700 bg-green-50/30 border-l border-gray-200">
                        {totalP}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-red-700 bg-red-50/30">
                        {totalA}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500 flex gap-4 p-2 bg-gray-50 rounded-lg mt-4">
        <span className="font-semibold text-gray-700">Legend:</span>
        {activeTab === "EMPLOYEE" ? (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-200 inline-block rounded-sm"></span>{" "}
              Xm = Late Minutes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border border-gray-200 inline-block rounded-sm flex items-center justify-center text-green-500 text-[10px]">
                ✓
              </span>{" "}
              = On Time
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white border border-gray-200 inline-block rounded-sm flex items-center justify-center text-gray-300 text-[10px]">
                -
              </span>{" "}
              = Missing / No Record
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-200 inline-block rounded-sm"></span>{" "}
              P = Present (Not cleaned)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-200 inline-block rounded-sm"></span>{" "}
              C = Came & Cleaned
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-200 inline-block rounded-sm"></span>{" "}
              A = Absent
            </span>
          </>
        )}
      </div>
    </div>
  );
}
