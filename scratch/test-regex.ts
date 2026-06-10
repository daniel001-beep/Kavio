const sql = `select "id", "user_id" as "userId" from "transaction" where "transaction"."user_id" = $1`;
const params = ['usr_test_123'];
const sqlLower = sql.toLowerCase();

const whereMatch = sql.match(/where\s+([\s\S]+?)(?:order\s+by|limit|$)/i);
if (whereMatch) {
  const wherePart = whereMatch[1];
  console.log("wherePart:", wherePart);
  const matches = wherePart.matchAll(/([a-zA-Z_0-9."'-]+)\s*=\s*\$(\d+)/g);
  for (const match of matches) {
    console.log("Match found!");
    const rawCol = match[1];
    const paramIdx = parseInt(match[2]) - 1;
    const val = params[paramIdx];
    console.log("rawCol:", rawCol, "paramIdx:", paramIdx, "val:", val);
    const colName = rawCol.replace(/['"\`]/g, '').split('.').pop();
    console.log("colName:", colName);
  }
} else {
  console.log("No whereMatch");
}
