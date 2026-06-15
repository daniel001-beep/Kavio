import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { db } = await import("../src/db");
  const { users, clients } = await import("../src/db/schema");
  try {
    const userList = await db.select().from(users).limit(1);
    console.log("Users in DB:", userList);
    if (userList.length === 0) {
      console.log("No users in DB. Inserting a dummy user...");
      const [newUser] = await db.insert(users).values({
        id: "dummy_user_id_for_testing",
        email: "test@example.com",
        name: "Test User",
      }).returning();
      userList.push(newUser);
    }

    const testUserId = userList[0].id;
    console.log("Using testUserId:", testUserId);

    console.log("Inserting client...");
    const [newClient] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Test Client API",
        email: "testclient@example.com",
        phone: "+23480000000",
      })
      .returning();

    console.log("Inserted Client successfully:", newClient);

    // Log Client Activity
    const { clientActivities, clientRelationships } = await import("../src/db/schema");
    await db.insert(clientActivities).values({
      clientId: newClient.id,
      eventType: "CLIENT_CREATED",
      description: `Client record created for Test Client API.`
    });
    console.log("Inserted clientActivities successfully");

    // Create default relationship
    await db.insert(clientRelationships).values({
      clientId: newClient.id,
      preferredMethod: "EMAIL"
    });
    console.log("Inserted clientRelationships successfully");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

run().then(() => process.exit(0));
