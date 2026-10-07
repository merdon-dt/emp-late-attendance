"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Contract } from "@/prisma/contract.d";
import { setEmployeeStatus } from "@/app/actions/employee";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";
import { Search, Plus, MoreHorizontal, Edit2, Activity, UserX, UserPlus } from "lucide-react";
import EmployeeModal from "./EmployeeModal";
import ReportModal from "./ReportModal";

type Employee = {
  id: string;
  name: string;
  slug: string;
  type: "REGULAR" | "CLEANER";
  isActive: boolean;
  createdAt: Date;
};

export default function EmployeeClient({ initialEmployees, selectedSlug }: { initialEmployees: Employee[], selectedSlug?: string | null }) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "REGULAR" | "CLEANER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<{ id: string; name: string; type: "REGULAR" | "CLEANER" } | null>(null);

  const reportingEmp = useMemo(() => {
    console.log("selectedSlug from props:", selectedSlug);
    console.log("employees from props:", employees);
    if (!selectedSlug) return null;
    const found = employees.find(e => e.slug === selectedSlug) || null;
    console.log("found employee:", found);
    return found;
  }, [selectedSlug, employees]);

  const [confirmToggle, setConfirmToggle] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      if (search && !emp.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "ALL" && emp.type !== typeFilter) return false;
      if (statusFilter === "ACTIVE" && !emp.isActive) return false;
      if (statusFilter === "INACTIVE" && emp.isActive) return false;
      return true;
    });
  }, [employees, search, typeFilter, statusFilter]);

  async function handleToggleStatus(emp: Employee) {
    try {
      await setEmployeeStatus(emp.id, !emp.isActive);
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, isActive: !emp.isActive } : e));
      toast.success(`${emp.name} is now ${!emp.isActive ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error("Failed to change status");
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Employees</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">Manage employees and cleaning staff.</p>
        </div>

        <button 
          onClick={() => {
            setEditingEmp(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <ConfirmModal
        isOpen={!!confirmToggle}
        title={confirmToggle?.isActive ? "Deactivate Employee" : "Activate Employee"}
        message={`Are you sure you want to ${confirmToggle?.isActive ? "deactivate" : "activate"} ${confirmToggle?.name}? ${confirmToggle?.isActive ? "They will no longer appear in daily attendance tracking." : ""}`}
        confirmText={confirmToggle?.isActive ? "Deactivate" : "Activate"}
        isDestructive={confirmToggle?.isActive}
        onConfirm={() => confirmToggle && handleToggleStatus(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingEmp}
        onSuccess={(savedEmp) => {
          setEmployees(prev => {
            const exists = prev.some(e => e.id === savedEmp.id);
            if (exists) {
              return prev.map(e => e.id === savedEmp.id ? { ...e, ...savedEmp } : e);
            }
            return [savedEmp, ...prev];
          });
        }}
      />

      <ReportModal
        isOpen={!!reportingEmp}
        onClose={() => router.push("/employees")}
        employee={reportingEmp}
      />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-100 bg-white p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">Regular</option>
              <option value="CLEANER">Cleaner</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      emp.type === 'REGULAR' 
                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20' 
                        : 'bg-purple-50 text-purple-700 ring-purple-600/20'
                    }`}>
                      {emp.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      emp.isActive 
                        ? 'bg-green-50 text-green-700 ring-green-600/20' 
                        : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          router.push(`/employees/${emp.slug}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                      >
                        <Activity size={14} />
                        Report
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmp({ id: emp.id, name: emp.name, type: emp.type });
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => setConfirmToggle(emp)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          emp.isActive 
                            ? 'text-red-700 hover:bg-red-50' 
                            : 'text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {emp.isActive ? <UserX size={14} /> : <UserPlus size={14} />}
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <UserX className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
