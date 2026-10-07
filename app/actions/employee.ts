"use server";

import { db } from "@/lib/db";

export async function getEmployees() {
  return db.orm.public.Employee.all();
}

export async function createEmployee(data: {
  name: string;
  type: "REGULAR" | "CLEANER";
}) {
  const name = data.name.trim();
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!baseSlug) baseSlug = "employee";

  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.orm.public.Employee.where({ slug }).first();
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const emp = await db.orm.public.Employee.create({
    name,
    slug,
    type: data.type,
  });

  return {
    id: emp?.id,
    name: emp?.name,
    slug: emp?.slug,
    type: emp?.type,
    isActive: emp?.isActive,
  };
}

export async function updateEmployee(
  id: string,
  data: {
    name: string;
    type: "REGULAR" | "CLEANER";
  },
) {
  const emp = await db.orm.public.Employee.where({ id }).update({
    name: data.name.trim(),
    type: data.type,
  });

  return {
    id: emp?.id,
    name: emp?.name,
    slug: emp?.slug,
    type: emp?.type,
    isActive: emp?.isActive,
  };
}

export async function setEmployeeStatus(id: string, isActive: boolean) {
  const emp = await db.orm.public.Employee.where({ id }).update({
    isActive,
  });

  return {
    id: emp?.id,
    name: emp?.name,
    slug: emp?.slug,
    type: emp?.type,
    isActive: emp?.isActive,
  };
}

export async function getEmployeeReport(employeeId: string) {
  const [attendance, cleaning] = await Promise.all([
    db.orm.public.Attendance.where({ employeeId }).all(),
    db.orm.public.CleaningRecord.where({ employeeId }).all(),
  ]);
  return {
    attendance: attendance.map((a) => ({
      id: a.id,
      date: a.date.toString(),
      checkIn: a.checkIn ? a.checkIn.toString() : null,
      checkOut: a.checkOut ? a.checkOut.toString() : null,
    })),
    cleaning: cleaning.map((c) => ({
      id: c.id,
      date: c.date.toString(),
      came: c.came,
      cleaned: c.cleaned,
    })),
  };
}
