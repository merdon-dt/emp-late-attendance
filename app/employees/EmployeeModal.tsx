"use client";

import { useState, useEffect } from "react";
import { createEmployee, updateEmployee } from "@/app/actions/employee";

import { toast } from "sonner";
import { UserPlus, UserCog, X } from "lucide-react";

type EmployeeType = "REGULAR" | "CLEANER";

type EmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emp: any) => void;
  initialData?: { id: string; name: string; type: EmployeeType } | null;
};

export default function EmployeeModal({ isOpen, onClose, onSuccess, initialData }: EmployeeModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<EmployeeType>("REGULAR");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
      } else {
        setName("");
        setType("REGULAR");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Employee name is required");
      return;
    }

    try {
      setLoading(true);
      
      let savedEmp;
      if (initialData?.id) {
        savedEmp = await updateEmployee(initialData.id, {
          name: name.trim(),
          type,
        });
      } else {
        savedEmp = await createEmployee({
          name: name.trim(),
          type,
        });
      }

      toast.success(`Employee successfully ${initialData ? "updated" : "created"}!`);
      onSuccess(savedEmp);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${initialData ? "update" : "create"} employee`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm text-blue-600">
              {initialData ? <UserCog size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {initialData ? "Edit Employee" : "Add Employee"}
              </h2>
              <p className="text-xs text-gray-500">{initialData ? "Update employee details." : "Add a new employee to the system."}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter employee name"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Employee Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EmployeeType)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="REGULAR">Regular</option>
              <option value="CLEANER">Cleaner</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : initialData ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
