import { db } from "../src/db";
import { invoices } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Fetching all invoices...");
  const allInvoices = await db.query.invoices.findMany();
  
  let updatedCount = 0;

  for (const invoice of allInvoices) {
    if (invoice.paymentInstructions && invoice.paymentInstructions.includes("When making payment, include")) {
      // Use regex to remove the sentence "When making payment, include KAV-XXXX in your transfer narration/reference."
      // and any preceding newlines.
      const newInstructions = invoice.paymentInstructions.replace(
        /\n*When making payment, include .*? in your transfer narration\/reference\./,
        ""
      );

      await db.update(invoices).set({ paymentInstructions: newInstructions }).where(eq(invoices.id, invoice.id));
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} existing invoices to remove the narration instruction.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error running script:", err);
  process.exit(1);
});
