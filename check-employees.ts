import { db } from './lib/db';
async function main() {
  const employees = await db.orm.public.Employee.all();
  console.log(JSON.stringify(employees, null, 2));
}
main().catch(console.error);
