import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  try {
    const userList = await db.select().from(users);
    console.log("All Users in DB:");
    userList.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`));
  } catch (error) {
    console.error("❌ Failed to list users:", error);
  }
}

run().then(() => process.exit(0));
