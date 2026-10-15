import { getEmployees } from "@/app/actions/employee";
import EmployeeClient from "../EmployeeClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const employees = await getEmployees();

  const serialized = employees.map((emp) => ({
    id: emp.id,
    empId: emp.empId,
    name: emp.name,
    slug: emp.slug,
    type: emp.type,
    isActive: emp.isActive,
  }));

  const selectedSlug = resolvedParams.slug?.[0] || null;

  return (
    <EmployeeClient
      initialEmployees={serialized}
      selectedSlug={selectedSlug}
    />
  );
}
