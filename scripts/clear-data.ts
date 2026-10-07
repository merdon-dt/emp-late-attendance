import { db } from "../lib/db";

async function clearData() {
  console.log("Clearing data...");
  const runtime = db.runtime();
  await runtime.execute(db.raw.sql`DELETE FROM "CleaningRecord"`.affectedCount().build());
  await runtime.execute(db.raw.sql`DELETE FROM "Attendance"`.affectedCount().build());
  await runtime.execute(db.raw.sql`DELETE FROM "Employee"`.affectedCount().build());
  
  console.log("Database cleared successfully.");
  await db.close();
}

clearData().catch(console.error);
