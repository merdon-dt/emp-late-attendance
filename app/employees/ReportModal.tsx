"use client";

import { useState, useEffect, useMemo } from "react";
import { getEmployeeReport } from "@/app/actions/employee";
import {
  updateAttendanceTimes,
  addPastAttendance,
} from "@/app/actions/attendance";
import { Temporal } from "temporal-polyfill";
import {
  X,
  Calendar,
  Clock,
  Edit2,
  Check,
  AlertCircle,
  Save,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import { ATTENDANCE_LATE_TIME } from "@/lib/date";

type AttendanceItem = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
};

type CleaningItem = {
  id: string;
  date: string;
  came: boolean;
  cleaned: boolean;
  onLeave: boolean;
  officeLeave?: boolean;
  grannyLeave?: boolean;
  comment?: string | null;
};

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: string; name: string; type: "REGULAR" | "CLEANER" } | null;
};

export default function ReportModal({
  isOpen,
  onClose,
  employee,
}: ReportModalProps) {
  const [reportData, setReportData] = useState<{
    attendance: AttendanceItem[];
    cleaning: CleaningItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "LATE">("ALL");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editCheckIn, setEditCheckIn] = useState<string>("");
  const [editCheckOut, setEditCheckOut] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addCheckIn, setAddCheckIn] = useState(ATTENDANCE_LATE_TIME);
  const [addCheckOut, setAddCheckOut] = useState("18:50");

  const handleAddPast = async () => {
    if (!addDate) return;
    setIsSaving(true);
    try {
      await addPastAttendance(employee!.id, addDate, addCheckIn, addCheckOut);
      const data = await getEmployeeReport(employee!.id);
      setReportData(data);
      setIsAdding(false);
      setAddDate("");
    } catch (err: unknown) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to add past attendance",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTime = async (record: AttendanceItem) => {
    setIsSaving(true);
    try {
      const dateStr = record.date.toString();

      let checkInStr = null;
      if (editCheckIn) {
        checkInStr = Temporal.PlainDate.from(dateStr)
          .toZonedDateTime("Asia/Kolkata")
          .withPlainTime(editCheckIn)
          .toInstant()
          .toString();
      }

      let checkOutStr = null;
      if (editCheckOut) {
        checkOutStr = Temporal.PlainDate.from(dateStr)
          .toZonedDateTime("Asia/Kolkata")
          .withPlainTime(editCheckOut)
          .toInstant()
          .toString();
      }

      await updateAttendanceTimes(record.id, checkInStr, checkOutStr);

      const data = await getEmployeeReport(employee!.id);
      setReportData(data);
      setEditingRecordId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update times");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (record: AttendanceItem) => {
    setEditingRecordId(record.id);
    if (record.checkIn) {
      setEditCheckIn(
        Temporal.Instant.from(record.checkIn)
          .toZonedDateTimeISO("Asia/Kolkata")
          .toPlainTime()
          .toString({ smallestUnit: "minute" })
          .substring(0, 5),
      );
    } else {
      setEditCheckIn("");
    }
    if (record.checkOut) {
      setEditCheckOut(
        Temporal.Instant.from(record.checkOut)
          .toZonedDateTimeISO("Asia/Kolkata")
          .toPlainTime()
          .toString({ smallestUnit: "minute" })
          .substring(0, 5),
      );
    } else {
      setEditCheckOut("18:50");
    }
  };

  useEffect(() => {
    let ignore = false;
    if (isOpen && employee) {
      queueMicrotask(() => setLoading(true));
      getEmployeeReport(employee.id)
        .then((data) => {
          if (!ignore) {
            setReportData(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!ignore) {
            console.error(err);
            setLoading(false);
          }
        });
    } else {
      queueMicrotask(() => {
        setReportData(null);
        setLoading(false);
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, employee]);

  const { totalLateMinutes, lateAttendanceRecords } = useMemo(() => {
    if (!reportData?.attendance)
      return { totalLateMinutes: 0, lateAttendanceRecords: [] };

    let totalMins = 0;
    const lateRecords: typeof reportData.attendance = [];

    reportData.attendance.forEach((record) => {
      let dayLateMins = 0;
      if (record.checkIn) {
        const zdtIn = Temporal.Instant.from(record.checkIn).toZonedDateTimeISO(
          "Asia/Kolkata",
        );
        const cutoffIn = zdtIn.withPlainTime(ATTENDANCE_LATE_TIME);
        const diffInMs = zdtIn.epochMilliseconds - cutoffIn.epochMilliseconds;
        if (diffInMs > 0) {
          dayLateMins += Math.floor(diffInMs / 60000);
        }
      }

      if (dayLateMins > 0) {
        totalMins += dayLateMins;
        lateRecords.push(record);
      }
    });

    return { totalLateMinutes: totalMins, lateAttendanceRecords: lateRecords };
  }, [reportData]);

  const displayedAttendanceRecords = useMemo(() => {
    if (!reportData?.attendance) return [];
    if (filter === "LATE") return lateAttendanceRecords;
    return reportData.attendance;
  }, [reportData, filter, lateAttendanceRecords]);

  if (!isOpen || !employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-gray-900/60 backdrop-blur-sm sm:p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="h-full w-full sm:max-w-lg bg-white/95 backdrop-blur-md shadow-2xl sm:rounded-2xl flex flex-col overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-white/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${employee.type === "REGULAR" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
            >
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {employee.name}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {employee.type === "REGULAR"
                  ? "Regular Staff Activity"
                  : "Cleaning Staff Activity"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading report...</p>
          ) : (
            <>
              {employee.type === "REGULAR" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="text-blue-500" size={18} />
                      Attendance History
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-medium bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm text-gray-600">
                        <span className="text-gray-400 mr-1">Late Days:</span>
                        <span className="text-gray-900">
                          {lateAttendanceRecords.length}
                        </span>
                      </div>
                      <div className="text-xs font-medium bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm text-gray-600">
                        <span className="text-gray-400 mr-1">Late Mins:</span>
                        <span className="text-amber-600">
                          {totalLateMinutes}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <button
                      onClick={() => setIsAdding(!isAdding)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-100/50"
                    >
                      {isAdding ? (
                        <>Cancel</>
                      ) : (
                        <>
                          <CalendarPlus size={16} /> Add Missing Record
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setFilter("ALL")}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          filter === "ALL"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        All ({reportData?.attendance.length ?? 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilter("LATE")}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          filter === "LATE"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Late Only ({lateAttendanceRecords.length})
                      </button>
                    </div>
                  </div>

                  {isAdding && (
                    <div className="bg-white border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        New Record
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex flex-col text-sm">
                          <span className="text-gray-500 mb-1.5 font-medium text-xs uppercase tracking-wider">
                            Date
                          </span>
                          <input
                            type="date"
                            value={addDate}
                            onChange={(e) => setAddDate(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                          />
                        </label>
                        <label className="flex flex-col text-sm">
                          <span className="text-gray-500 mb-1.5 font-medium text-xs uppercase tracking-wider">
                            Check In
                          </span>
                          <input
                            type="time"
                            value={addCheckIn}
                            onChange={(e) => setAddCheckIn(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                          />
                        </label>
                        <label className="flex flex-col text-sm">
                          <span className="text-gray-500 mb-1.5 font-medium text-xs uppercase tracking-wider">
                            Check Out
                          </span>
                          <input
                            type="time"
                            value={addCheckOut}
                            onChange={(e) => setAddCheckOut(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                          />
                        </label>
                      </div>
                      <button
                        onClick={handleAddPast}
                        disabled={isSaving || !addDate}
                        className="mt-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSaving ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save size={16} /> Save Record
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {displayedAttendanceRecords.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">
                      {filter === "LATE"
                        ? "No late records found."
                        : "No attendance records found."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {displayedAttendanceRecords
                        .sort((a, b) =>
                          b.date.toString().localeCompare(a.date.toString()),
                        )
                        .map((record) => {
                          const checkInStr = record.checkIn
                            ? Temporal.Instant.from(record.checkIn)
                                .toZonedDateTimeISO("Asia/Kolkata")
                                .toPlainTime()
                                .toLocaleString("en-IN", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                            : "-";
                          const checkOutStr = record.checkOut
                            ? Temporal.Instant.from(record.checkOut)
                                .toZonedDateTimeISO("Asia/Kolkata")
                                .toPlainTime()
                                .toLocaleString("en-IN", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                            : "-";

                          let isLate = false;
                          let dayLateMins = 0;
                          if (record.checkIn) {
                            const zdtIn = Temporal.Instant.from(
                              record.checkIn,
                            ).toZonedDateTimeISO("Asia/Kolkata");
                            const cutoffIn =
                              zdtIn.withPlainTime(ATTENDANCE_LATE_TIME);
                            const diffInMs =
                              zdtIn.epochMilliseconds -
                              cutoffIn.epochMilliseconds;
                            if (diffInMs > 0) {
                              dayLateMins += Math.floor(diffInMs / 60000);
                            }
                          }

                          isLate = dayLateMins > 0;

                          return (
                            <div
                              key={record.id}
                              className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="w-full sm:w-auto">
                                <p className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                  {record.date.toString()}
                                  {editingRecordId !== record.id && (
                                    <button
                                      onClick={() => startEdit(record)}
                                      className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                                      title="Edit Time"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                </p>
                                {editingRecordId === record.id ? (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 w-full sm:w-auto">
                                    <div className="flex gap-3 w-full sm:w-auto">
                                      <label className="flex items-center gap-2 flex-1">
                                        <span className="text-gray-500 font-medium">
                                          In:
                                        </span>
                                        <input
                                          type="time"
                                          value={editCheckIn}
                                          onChange={(e) =>
                                            setEditCheckIn(e.target.value)
                                          }
                                          className="border border-gray-200 rounded px-2 py-1 w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                      <label className="flex items-center gap-2 flex-1">
                                        <span className="text-gray-500 font-medium">
                                          Out:
                                        </span>
                                        <input
                                          type="time"
                                          value={editCheckOut}
                                          onChange={(e) =>
                                            setEditCheckOut(e.target.value)
                                          }
                                          className="border border-gray-200 rounded px-2 py-1 w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                      <button
                                        onClick={() => handleSaveTime(record)}
                                        disabled={isSaving}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                                      >
                                        {isSaving ? (
                                          "Saving..."
                                        ) : (
                                          <>
                                            <Check size={14} /> Save
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => setEditingRecordId(null)}
                                        disabled={isSaving}
                                        className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                      In:{" "}
                                      <strong className="text-gray-700">
                                        {checkInStr}
                                      </strong>
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      Out:{" "}
                                      <strong className="text-gray-700">
                                        {checkOutStr}
                                      </strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 self-start sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                                {isLate && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200/50 shadow-sm">
                                    <AlertCircle size={12} />
                                    Late {dayLateMins}m
                                  </span>
                                )}
                                {!isLate && record.checkIn && (
                                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200/50 shadow-sm">
                                    <CheckCircle2 size={12} />
                                    On Time
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {employee.type === "CLEANER" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-purple-500" size={18} />
                    Cleaning History
                  </h3>
                  {reportData?.cleaning.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-white p-8 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-center gap-2">
                      <Calendar className="text-gray-300" size={32} />
                      No records found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reportData?.cleaning
                        .sort((a, b) =>
                          b.date.toString().localeCompare(a.date.toString()),
                        )
                        .map((record) => (
                          <div
                            key={record.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                              <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                {record.date.toString()}
                              </p>
                              <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                                {record.officeLeave && (
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <Building2 size={12} /> Office Leave
                                  </span>
                                )}

                                {record.grannyLeave && (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <UserMinus size={12} /> Granny Leave
                                  </span>
                                )}

                                {record.came ? (
                                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <CheckCircle2 size={12} /> Came
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <XCircle size={12} /> Absent
                                  </span>
                                )}

                                {record.cleaned ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <Sparkles size={12} /> Cleaned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200/50 shadow-sm flex-1 sm:flex-auto justify-center">
                                    <XCircle size={12} /> Not Cleaned
                                  </span>
                                )}
                              </div>
                            </div>
                            {record.comment && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100 flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-gray-400 shrink-0" />
                                <span>{record.comment}</span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
