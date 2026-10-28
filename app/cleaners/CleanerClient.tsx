"use client";

import { useState } from "react";
import {
  setCleanerDailyStatus,
  updateCleanerRecord,
  addPastCleanerRecord,
} from "@/app/actions/cleaner";
import { toast } from "sonner";
import {
  Check,
  X,
  Search,
  Filter,
  Edit2,
  Save,
  Plus,
  Building2,
  UserMinus,
  MessageSquare,
} from "lucide-react";

type Employee = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

type CleaningRecord = {
  id: string;
  employeeId: string;
  came: boolean;
  cleaned: boolean;
  onLeave: boolean;
  officeLeave: boolean;
  grannyLeave: boolean;
  comment: string | null;
};

type CleanerWithRecord = Employee & {
  record: CleaningRecord | null;
};

type HistoryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  came: boolean;
  cleaned: boolean;
  onLeave: boolean;
  officeLeave: boolean;
  grannyLeave: boolean;
  comment: string | null;
};

export default function CleanerClient({
  initialData,
  initialHistory,
}: {
  initialData: CleanerWithRecord[];
  initialHistory: HistoryRecord[];
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"TODAY" | "HISTORY">("TODAY");
  const [historyRecords, setHistoryRecords] = useState(initialHistory);

  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editState, setEditState] = useState({
    came: false,
    cleaned: false,
    onLeave: false,
    officeLeave: false,
    grannyLeave: false,
    comment: "",
  });

  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [searchHistory, setSearchHistory] = useState("");

  const [isAddingPast, setIsAddingPast] = useState(false);
  const [pastForm, setPastForm] = useState({
    employeeId: "",
    date: "",
    came: true,
    cleaned: true,
    onLeave: false,
    officeLeave: false,
    grannyLeave: false,
    comment: "",
  });
  const [isSavingPast, setIsSavingPast] = useState(false);

  const handleUpdateToday = async (
    employeeId: string,
    updates: {
      came?: boolean;
      cleaned?: boolean;
      onLeave?: boolean;
      officeLeave?: boolean;
      grannyLeave?: boolean;
      comment?: string | null;
    },
  ) => {
    try {
      const updated = await setCleanerDailyStatus(employeeId, updates);
      setData((prev) =>
        prev.map((emp) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              record: {
                id: updated.id || emp.record?.id || "temp-id",
                employeeId,
                came: updated.came ?? false,
                cleaned: updated.cleaned ?? false,
                onLeave: updated.onLeave ?? false,
                officeLeave: updated.officeLeave ?? false,
                grannyLeave: updated.grannyLeave ?? false,
                comment: updated.comment ?? null,
              },
            };
          }
          return emp;
        }),
      );
      toast.success("Updated status");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleLeaveChange = (
    employeeId: string,
    leaveType: "NONE" | "OFFICE" | "GRANNY",
  ) => {
    if (leaveType === "OFFICE") {
      handleUpdateToday(employeeId, {
        officeLeave: true,
        grannyLeave: false,
        onLeave: true,
        came: false,
        cleaned: false,
      });
    } else if (leaveType === "GRANNY") {
      handleUpdateToday(employeeId, {
        officeLeave: false,
        grannyLeave: true,
        onLeave: true,
        came: false,
        cleaned: false,
      });
    } else {
      handleUpdateToday(employeeId, {
        officeLeave: false,
        grannyLeave: false,
        onLeave: false,
      });
    }
  };

  const startHistoryEdit = (record: HistoryRecord) => {
    setEditingHistoryId(record.id);
    setEditState({
      came: record.came,
      cleaned: record.cleaned,
      onLeave: record.onLeave,
      officeLeave: record.officeLeave ?? false,
      grannyLeave: record.grannyLeave ?? false,
      comment: record.comment || "",
    });
  };

  const saveHistoryEdit = async (id: string) => {
    try {
      await updateCleanerRecord(id, {
        came: editState.came,
        cleaned: editState.cleaned,
        onLeave: editState.officeLeave || editState.grannyLeave || editState.onLeave,
        officeLeave: editState.officeLeave,
        grannyLeave: editState.grannyLeave,
        comment: editState.comment.trim() || null,
      });
      setHistoryRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                came: editState.came,
                cleaned: editState.cleaned,
                onLeave: editState.officeLeave || editState.grannyLeave || editState.onLeave,
                officeLeave: editState.officeLeave,
                grannyLeave: editState.grannyLeave,
                comment: editState.comment.trim() || null,
              }
            : r,
        ),
      );
      setEditingHistoryId(null);
      toast.success("History record updated");
    } catch {
      toast.error("Failed to update history record");
    }
  };

  const handleAddPast = async () => {
    if (!pastForm.employeeId || !pastForm.date)
      return toast.error("Please select cleaner and date");

    setIsSavingPast(true);
    try {
      const isOnLeave = pastForm.officeLeave || pastForm.grannyLeave || pastForm.onLeave;
      const newRecord = await addPastCleanerRecord(
        pastForm.employeeId,
        pastForm.date,
        {
          came: pastForm.came,
          cleaned: pastForm.cleaned,
          onLeave: isOnLeave,
          officeLeave: pastForm.officeLeave,
          grannyLeave: pastForm.grannyLeave,
          comment: pastForm.comment.trim() || null,
        },
      );
      const empName =
        data.find((e) => e.id === pastForm.employeeId)?.name || "Unknown";

      setHistoryRecords((prev) =>
        [
          {
            id: newRecord.id,
            employeeId: pastForm.employeeId,
            employeeName: empName,
            date: pastForm.date,
            came: newRecord.came,
            cleaned: newRecord.cleaned,
            onLeave: newRecord.onLeave,
            officeLeave: newRecord.officeLeave,
            grannyLeave: newRecord.grannyLeave,
            comment: newRecord.comment,
          },
          ...prev,
        ].sort((a, b) => b.date.localeCompare(a.date)),
      );

      setIsAddingPast(false);
      setPastForm({
        employeeId: "",
        date: "",
        came: true,
        cleaned: true,
        onLeave: false,
        officeLeave: false,
        grannyLeave: false,
        comment: "",
      });
      toast.success("Past record added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add record");
    } finally {
      setIsSavingPast(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Cleaner Tracking
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Track daily attendance, cleaning tasks, leaves, and notes.
          </p>
        </div>
      </div>

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
            Today&apos;s Status
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
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Today:{" "}
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium min-w-[140px]">Cleaner</th>
                  <th className="px-6 py-3 font-medium min-w-[160px]">Attendance</th>
                  <th className="px-6 py-3 font-medium min-w-[160px]">Cleaning</th>
                  <th className="px-6 py-3 font-medium min-w-[260px]">Leave Type</th>
                  <th className="px-6 py-3 font-medium min-w-[220px]">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No active cleaners found.
                    </td>
                  </tr>
                ) : (
                  data.map((emp) => {
                    const currentLeave = emp.record?.officeLeave
                      ? "OFFICE"
                      : emp.record?.grannyLeave
                        ? "GRANNY"
                        : "NONE";

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                            <button
                              onClick={() =>
                                handleUpdateToday(emp.id, {
                                  came: true,
                                  officeLeave: false,
                                  grannyLeave: false,
                                  onLeave: false,
                                })
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                emp.record?.came === true
                                  ? "bg-white text-green-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {emp.record?.came === true && <Check size={14} />}
                                Present
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateToday(emp.id, { came: false })
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                emp.record?.came === false
                                  ? "bg-white text-red-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {emp.record?.came === false && <X size={14} />}
                                Absent
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                            <button
                              onClick={() =>
                                handleUpdateToday(emp.id, {
                                  cleaned: true,
                                  officeLeave: false,
                                  grannyLeave: false,
                                  onLeave: false,
                                })
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                emp.record?.cleaned === true
                                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {emp.record?.cleaned === true && (
                                  <Check size={14} />
                                )}
                                Cleaned
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateToday(emp.id, { cleaned: false })
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                emp.record?.cleaned === false
                                  ? "bg-white text-gray-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {emp.record?.cleaned === false && (
                                  <X size={14} />
                                )}
                                Skipped
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                            <button
                              onClick={() => handleLeaveChange(emp.id, "NONE")}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                currentLeave === "NONE"
                                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              Working
                            </button>
                            <button
                              onClick={() => handleLeaveChange(emp.id, "OFFICE")}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                currentLeave === "OFFICE"
                                  ? "bg-white text-indigo-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Building2 size={13} /> Office Leave
                              </span>
                            </button>
                            <button
                              onClick={() => handleLeaveChange(emp.id, "GRANNY")}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                currentLeave === "GRANNY"
                                  ? "bg-white text-rose-700 shadow-sm border border-gray-200/50"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <UserMinus size={13} /> Granny Leave
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare
                              size={14}
                              className="text-gray-400 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder="Add comment..."
                              defaultValue={emp.record?.comment || ""}
                              key={`${emp.id}-${emp.record?.comment ?? ""}`}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (emp.record?.comment || "")) {
                                  handleUpdateToday(emp.id, {
                                    comment: val || null,
                                  });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-full rounded-md border border-gray-200 px-2.5 py-1 text-xs bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
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

      {activeTab === "HISTORY" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 bg-white p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
              <div className="relative max-w-md flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search history by cleaner or comment..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingPast(!isAddingPast)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                  Add Past Data
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 outline-none"
                />
              </div>
            </div>

            {isAddingPast && (
              <div className="bg-gray-50/50 p-4 sm:p-6 border-b border-gray-100 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  New Cleaning Record
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Cleaner
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-white"
                      value={pastForm.employeeId}
                      onChange={(e) =>
                        setPastForm((s) => ({ ...s, employeeId: e.target.value }))
                      }
                    >
                      <option value="">Select cleaner...</option>
                      {data.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-white"
                      value={pastForm.date}
                      onChange={(e) =>
                        setPastForm((s) => ({ ...s, date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Comment / Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deep cleaning / Diwali holiday"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-white"
                      value={pastForm.comment}
                      onChange={(e) =>
                        setPastForm((s) => ({ ...s, comment: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-600"
                      checked={pastForm.came}
                      onChange={(e) =>
                        setPastForm((s) => ({ ...s, came: e.target.checked }))
                      }
                    />
                    Came / Present
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={pastForm.cleaned}
                      onChange={(e) =>
                        setPastForm((s) => ({
                          ...s,
                          cleaned: e.target.checked,
                        }))
                      }
                    />
                    Cleaned
                  </label>

                  <div className="h-4 w-px bg-gray-300 hidden sm:block" />

                  <label className="flex items-center gap-2 text-sm cursor-pointer text-indigo-800">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={pastForm.officeLeave}
                      onChange={(e) =>
                        setPastForm((s) => ({
                          ...s,
                          officeLeave: e.target.checked,
                          grannyLeave: e.target.checked ? false : s.grannyLeave,
                          onLeave: e.target.checked || s.grannyLeave,
                        }))
                      }
                    />
                    Office Leave
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-rose-800">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-600"
                      checked={pastForm.grannyLeave}
                      onChange={(e) =>
                        setPastForm((s) => ({
                          ...s,
                          grannyLeave: e.target.checked,
                          officeLeave: e.target.checked ? false : s.officeLeave,
                          onLeave: e.target.checked || s.officeLeave,
                        }))
                      }
                    />
                    Granny Leave
                  </label>

                  <div className="ml-auto">
                    <button
                      onClick={handleAddPast}
                      disabled={isSavingPast}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                      <Save size={16} /> Save Record
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const monthRecords = historyRecords.filter((r) => {
                const matchesMonth = r.date.startsWith(selectedMonth);
                if (!matchesMonth) return false;
                if (!searchHistory) return true;
                const q = searchHistory.toLowerCase();
                return (
                  r.employeeName.toLowerCase().includes(q) ||
                  (r.comment && r.comment.toLowerCase().includes(q))
                );
              });

              const statsMap = new Map<
                string,
                {
                  name: string;
                  came: number;
                  cleaned: number;
                  officeLeave: number;
                  grannyLeave: number;
                }
              >();

              historyRecords
                .filter((r) => r.date.startsWith(selectedMonth))
                .forEach((r) => {
                  const stat = statsMap.get(r.employeeId) || {
                    name: r.employeeName,
                    came: 0,
                    cleaned: 0,
                    officeLeave: 0,
                    grannyLeave: 0,
                  };
                  if (r.came) stat.came++;
                  if (r.cleaned) stat.cleaned++;
                  if (r.officeLeave) stat.officeLeave++;
                  if (r.grannyLeave) stat.grannyLeave++;
                  statsMap.set(r.employeeId, stat);
                });

              const statsArray = Array.from(statsMap.values());

              return (
                <>
                  {statsArray.length > 0 && (
                    <div className="bg-blue-50/50 p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Filter size={16} className="text-blue-600" />
                        Summary for{" "}
                        {new Date(selectedMonth + "-01").toLocaleDateString(
                          "en-US",
                          { month: "long", year: "numeric" },
                        )}
                      </h3>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                              <th className="px-6 py-3 font-medium">Cleaner</th>
                              <th className="px-6 py-3 font-medium">Days Came</th>
                              <th className="px-6 py-3 font-medium">Days Cleaned</th>
                              <th className="px-6 py-3 font-medium text-indigo-700">Office Leaves</th>
                              <th className="px-6 py-3 font-medium text-rose-700">Granny Leaves</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {statsArray.map((stat) => (
                              <tr
                                key={stat.name}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-6 py-3 font-medium text-gray-900">
                                  {stat.name}
                                </td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-md font-medium text-xs ring-1 ring-inset ring-green-600/20">
                                    <Check size={14} /> {stat.came}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-medium text-xs ring-1 ring-inset ring-blue-600/20">
                                    <Check size={14} /> {stat.cleaned}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md font-medium text-xs ring-1 ring-inset ring-indigo-600/20">
                                    <Building2 size={13} /> {stat.officeLeave}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md font-medium text-xs ring-1 ring-inset ring-rose-600/20">
                                    <UserMinus size={13} /> {stat.grannyLeave}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-medium min-w-[120px]">Date</th>
                          <th className="px-6 py-3 font-medium min-w-[140px]">Cleaner</th>
                          <th className="px-6 py-3 font-medium min-w-[90px]">Came</th>
                          <th className="px-6 py-3 font-medium min-w-[90px]">Cleaned</th>
                          <th className="px-6 py-3 font-medium min-w-[150px]">Leave</th>
                          <th className="px-6 py-3 font-medium min-w-[200px]">Comment</th>
                          <th className="px-6 py-3 font-medium text-right min-w-[100px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {monthRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-8 text-center text-gray-500"
                            >
                              No historical records found for {selectedMonth}.
                            </td>
                          </tr>
                        ) : (
                          monthRecords.map((record) => (
                            <tr
                              key={record.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium text-gray-900">
                                <div className="flex flex-col">
                                  <span>{record.date}</span>
                                  <span className="text-xs text-gray-500 font-normal">
                                    {new Date(record.date).toLocaleDateString(
                                      "en-US",
                                      { weekday: "long" },
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 font-medium">
                                {record.employeeName}
                              </td>

                              {editingHistoryId === record.id ? (
                                <>
                                  <td className="px-6 py-4">
                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-600 cursor-pointer"
                                        checked={editState.came}
                                        onChange={(e) =>
                                          setEditState((s) => ({
                                            ...s,
                                            came: e.target.checked,
                                          }))
                                        }
                                      />
                                      Came
                                    </label>
                                  </td>
                                  <td className="px-6 py-4">
                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                        checked={editState.cleaned}
                                        onChange={(e) =>
                                          setEditState((s) => ({
                                            ...s,
                                            cleaned: e.target.checked,
                                          }))
                                        }
                                      />
                                      Cleaned
                                    </label>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-xs">
                                      <label className="flex items-center gap-1.5 cursor-pointer text-indigo-700">
                                        <input
                                          type="checkbox"
                                          checked={editState.officeLeave}
                                          onChange={(e) =>
                                            setEditState((s) => ({
                                              ...s,
                                              officeLeave: e.target.checked,
                                              grannyLeave: e.target.checked
                                                ? false
                                                : s.grannyLeave,
                                              onLeave:
                                                e.target.checked || s.grannyLeave,
                                            }))
                                          }
                                        />
                                        Office Leave
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                                        <input
                                          type="checkbox"
                                          checked={editState.grannyLeave}
                                          onChange={(e) =>
                                            setEditState((s) => ({
                                              ...s,
                                              grannyLeave: e.target.checked,
                                              officeLeave: e.target.checked
                                                ? false
                                                : s.officeLeave,
                                              onLeave:
                                                e.target.checked || s.officeLeave,
                                            }))
                                          }
                                        />
                                        Granny Leave
                                      </label>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      placeholder="Add comment..."
                                      value={editState.comment}
                                      onChange={(e) =>
                                        setEditState((s) => ({
                                          ...s,
                                          comment: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() =>
                                          saveHistoryEdit(record.id)
                                        }
                                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                      >
                                        <Save size={13} /> Save
                                      </button>
                                      <button
                                        onClick={() =>
                                          setEditingHistoryId(null)
                                        }
                                        className="inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        record.came
                                          ? "bg-green-50 text-green-700 ring-green-600/20"
                                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                                      }`}
                                    >
                                      {record.came ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        record.cleaned
                                          ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                                      }`}
                                    >
                                      {record.cleaned ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {record.officeLeave ? (
                                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                        <Building2 size={12} /> Office Leave
                                      </span>
                                    ) : record.grannyLeave ? (
                                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                        <UserMinus size={12} /> Granny Leave
                                      </span>
                                    ) : record.onLeave ? (
                                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                        On Leave
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">
                                        Working
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">
                                    {record.comment ? (
                                      <span className="flex items-center gap-1 text-gray-700">
                                        <MessageSquare
                                          size={13}
                                          className="text-gray-400 shrink-0"
                                        />
                                        <span className="truncate" title={record.comment}>
                                          {record.comment}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => startHistoryEdit(record)}
                                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <Edit2 size={14} /> Edit
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
