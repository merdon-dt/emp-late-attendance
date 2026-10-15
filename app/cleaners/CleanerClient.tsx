"use client";

import { useState } from "react";
import {
  toggleCleanerState,
  updateCleanerRecord,
  addPastCleanerRecord,
} from "@/app/actions/cleaner";
import { toast } from "sonner";
import { Check, X, Search, Filter, Edit2, Save, Plus } from "lucide-react";

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
  const [editState, setEditState] = useState({ came: false, cleaned: false, onLeave: false });

  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const [isAddingPast, setIsAddingPast] = useState(false);
  const [pastForm, setPastForm] = useState({
    employeeId: "",
    date: "",
    came: true,
    cleaned: true,
    onLeave: false,
  });
  const [isSavingPast, setIsSavingPast] = useState(false);

  const handleSetState = async (
    employeeId: string,
    field: "came" | "cleaned" | "onLeave",
    newValue: boolean,
  ) => {
    try {
      await toggleCleanerState(employeeId, field, newValue);
      setData((prev) =>
        prev.map((emp) => {
          if (emp.id === employeeId) {
            const newRecord = emp.record
              ? { ...emp.record, [field]: newValue }
              : {
                  id: "temp-id",
                  employeeId,
                  came: field === "came" ? newValue : false,
                  cleaned: field === "cleaned" ? newValue : false,
                  onLeave: field === "onLeave" ? newValue : false,
                };
            return { ...emp, record: newRecord };
          }
          return emp;
        }),
      );
      toast.success(`Updated ${field} status`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const startHistoryEdit = (record: HistoryRecord) => {
    setEditingHistoryId(record.id);
    setEditState({ came: record.came, cleaned: record.cleaned, onLeave: record.onLeave });
  };

  const saveHistoryEdit = async (id: string) => {
    try {
      await updateCleanerRecord(id, editState.came, editState.cleaned, editState.onLeave);
      setHistoryRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, came: editState.came, cleaned: editState.cleaned, onLeave: editState.onLeave }
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
      return toast.error("Please select employee and date");

    setIsSavingPast(true);
    try {
      const newRecord = await addPastCleanerRecord(
        pastForm.employeeId,
        pastForm.date,
        pastForm.came,
        pastForm.cleaned,
        pastForm.onLeave,
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
            came: pastForm.came,
            cleaned: pastForm.cleaned,
            onLeave: pastForm.onLeave,
          },
          ...prev,
        ].sort((a, b) => b.date.toString().localeCompare(a.date.toString())),
      );

      setIsAddingPast(false);
      setPastForm({ employeeId: "", date: "", came: true, cleaned: true, onLeave: false });
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
            Track attendance and cleaning completion.
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
                  <th className="px-6 py-3 font-medium">Cleaner</th>
                  <th className="px-6 py-3 font-medium">Came</th>
                  <th className="px-6 py-3 font-medium">Cleaned</th>
                  <th className="px-6 py-3 font-medium">On Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No active cleaners found.
                    </td>
                  </tr>
                ) : (
                  data.map((emp) => (
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
                            onClick={() => handleSetState(emp.id, "came", true)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.came === true
                                ? "bg-white text-green-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.came === true && <Check size={14} />}{" "}
                              Present
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleSetState(emp.id, "came", false)
                            }
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.came === false
                                ? "bg-white text-red-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.came === false && <X size={14} />}{" "}
                              Absent
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                          <button
                            onClick={() =>
                              handleSetState(emp.id, "cleaned", true)
                            }
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.cleaned === true
                                ? "bg-white text-blue-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.cleaned === true && (
                                <Check size={14} />
                              )}{" "}
                              Cleaned
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleSetState(emp.id, "cleaned", false)
                            }
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.cleaned === false
                                ? "bg-white text-gray-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.cleaned === false && <X size={14} />}{" "}
                              Skipped
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                          <button
                            onClick={() =>
                              handleSetState(emp.id, "onLeave", true)
                            }
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.onLeave === true
                                ? "bg-white text-orange-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.onLeave === true && (
                                <Check size={14} />
                              )}{" "}
                              On Leave
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleSetState(emp.id, "onLeave", false)
                            }
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              emp.record?.onLeave === false
                                ? "bg-white text-gray-700 shadow-sm border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {emp.record?.onLeave === false && <X size={14} />}{" "}
                              Working
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                  placeholder="Search history..."
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
              <div className="bg-gray-50/50 p-4 sm:p-6 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
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
                <div className="flex items-center h-[38px]">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={pastForm.came}
                      onChange={(e) =>
                        setPastForm((s) => ({ ...s, came: e.target.checked }))
                      }
                    />
                    Came
                  </label>
                </div>
                <div className="flex items-center h-[38px]">
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
                </div>
                <div className="flex items-center h-[38px]">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                      checked={pastForm.onLeave}
                      onChange={(e) =>
                        setPastForm((s) => ({
                          ...s,
                          onLeave: e.target.checked,
                        }))
                      }
                    />
                    Leave
                  </label>
                </div>
                <div>
                  <button
                    onClick={handleAddPast}
                    disabled={isSavingPast}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} /> Save
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const monthRecords = historyRecords.filter((r) =>
                r.date.startsWith(selectedMonth),
              );
              const statsMap = new Map<
                string,
                { name: string; came: number; cleaned: number; leave: number }
              >();

              monthRecords.forEach((r) => {
                const stat = statsMap.get(r.employeeId) || {
                  name: r.employeeName,
                  came: 0,
                  cleaned: 0,
                  leave: 0,
                };
                if (r.came) stat.came++;
                if (r.cleaned) stat.cleaned++;
                if (r.onLeave) stat.leave++;
                statsMap.set(r.employeeId, stat);
              });

              const statsArray = Array.from(statsMap.values());

              return (
                <>
                  {statsArray.length > 0 && (
                    <div className="bg-blue-50/50 p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Filter size={16} className="text-blue-600" />
                        Overall Report for{" "}
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
                              <th className="px-6 py-3 font-medium">Days Leave</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {statsArray.map((stat) => (
                              <tr key={stat.name} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-gray-900">{stat.name}</td>
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
                                  <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md font-medium text-xs ring-1 ring-inset ring-orange-600/20">
                                    <Check size={14} /> {stat.leave}
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
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Cleaner</th>
                          <th className="px-6 py-3 font-medium">Came</th>
                          <th className="px-6 py-3 font-medium">Cleaned</th>
                          <th className="px-6 py-3 font-medium">Leave</th>
                          <th className="px-6 py-3 font-medium text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {monthRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
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
                              <td className="px-6 py-4 text-gray-700">
                                {record.employeeName}
                              </td>

                              {editingHistoryId === record.id ? (
                                <>
                                  <td className="px-6 py-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
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
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                                        checked={editState.onLeave}
                                        onChange={(e) =>
                                          setEditState((s) => ({
                                            ...s,
                                            onLeave: e.target.checked,
                                          }))
                                        }
                                      />
                                      Leave
                                    </label>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => saveHistoryEdit(record.id)}
                                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                    >
                                      <Save size={14} /> Save
                                    </button>
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
                                    <span
                                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        record.onLeave
                                          ? "bg-orange-50 text-orange-700 ring-orange-600/20"
                                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                                      }`}
                                    >
                                      {record.onLeave ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => startHistoryEdit(record)}
                                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
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
