import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";

const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return "";
  const parts = val.split(/["'\s]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (
      trimmed.startsWith("postgres://") ||
      trimmed.startsWith("postgresql://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed.replace(/[()]+$/g, "").trim();
    }
  }
  return val.trim().replace(/^["'()]+|["'()]+$/g, "").trim();
};

let connectionString = cleanEnvVar(process.env.POSTGRES_URL);

if (connectionString) {
  if (connectionString.includes("44.216.29.125")) {
    connectionString = connectionString.replace("44.216.29.125:6543", "aws-0-us-east-1.pooler.supabase.com:6543");
    connectionString = connectionString.replace("44.216.29.125:5432", "aws-0-us-east-1.pooler.supabase.com:5432");
  }
}

const localDbPath = path.join(process.cwd(), "local_dev_db.json");

let inMemoryDb: any = null;

export function getLocalDb() {
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@velox.com").toLowerCase().trim();
  const defaultDb = {
    users: [
      {
        id: "user_seed",
        name: "Idowu Daniel",
        email: adminEmail,
        password: "$2a$12$R.P9eP8QdskF/1yF6f4.8eY2m6bC7wZ3zS1J1V6.t9K1F3n4G5e2S", // hashed 'danielpassword123'
        isAdmin: true,
        emailVerified: null,
        image: null,
        security_lockdown: false
      }
    ],
    transactions: [],
    ledgerEntries: [],
    products: [
      {
        id: 1,
        name: "Enterprise Ledger Node",
        description: "High-performance cryptographically isolated ledger node.",
        price: 999.00,
        imageurl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=300",
        category: "Infrastructure",
        tags: ["ledger", "enterprise"],
        createdat: new Date().toISOString()
      },
      {
        id: 2,
        name: "Sentinel Threat Monitor",
        description: "Real-time auditing and zero-trust transaction sentinel.",
        price: 499.00,
        imageurl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=300",
        category: "Security",
        tags: ["sentinel", "realtime"],
        createdat: new Date().toISOString()
      }
    ],
    accounts: [],
    sessions: [],
    verificationTokens: [],
    orders: [],
    reviews: [],
    auditLogs: [],
    systemHealth: [],
    webhookEndpoints: []
  };

  try {
    if (!fs.existsSync(localDbPath)) {
      try {
        fs.writeFileSync(localDbPath, JSON.stringify(defaultDb, null, 2));
      } catch (writeErr: any) {
        console.warn("⚠️ [Resilient DB] Could not write seed to local JSON database (Read-only environment):", writeErr.message);
        if (!inMemoryDb) {
          inMemoryDb = defaultDb;
        }
      }
    }
    
    if (inMemoryDb) return inMemoryDb;
    return JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
  } catch (e) {
    if (!inMemoryDb) {
      inMemoryDb = defaultDb;
    }
    return inMemoryDb;
  }
}

export function saveLocalDb(data: any) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (writeErr: any) {
    console.warn("⚠️ [Resilient DB] Bypassed local database save (likely Read-only environment like Vercel):", writeErr.message);
    inMemoryDb = data;
  }
}

function mapParamsToColumns(sql: string, params: any[], columns: string[], targetObj: any, mapper: (col: string, val: any) => void) {
  const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);
  if (!valuesMatch) {
    columns.forEach((col, idx) => {
      const val = params[idx];
      if (val !== undefined) mapper(col, val);
    });
    return;
  }

  const valExprs = valuesMatch[1].split(',').map(v => v.trim());
  columns.forEach((col, idx) => {
    const expr = valExprs[idx];
    if (expr && expr.startsWith('$')) {
      const paramIdx = parseInt(expr.substring(1)) - 1;
      const val = params[paramIdx];
      if (val !== undefined) {
        mapper(col, val);
      }
    }
  });
}

function getRowValue(row: any, colName: string) {
  if (!row) return null;
  let val = undefined;
  if (row[colName] !== undefined) val = row[colName];
  else {
    const camelKey = colName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (row[camelKey] !== undefined) val = row[camelKey];
  }

  if (val === undefined) return null;

  if (colName.includes('date') || colName.includes('time') || colName.includes('_at')) {
    if (typeof val === 'string' && !isNaN(Date.parse(val))) {
      return new Date(val);
    }
  }

  return val;
}

function parseQueryColumns(sql: string): string[] {
  const sqlLower = sql.toLowerCase();
  
  if (sqlLower.includes('returning')) {
    const match = sql.match(/returning\s+([\s\S]+)$/i);
    if (match) {
      return match[1].split(',').map(c => {
        const parts = c.trim().split(/\s+as\s+/i);
        const colName = parts[parts.length - 1];
        return colName.replace(/['"`\s]/g, '').split('.').pop()!.toLowerCase();
      });
    }
  }
  
  if (sqlLower.includes('select')) {
    const match = sql.match(/select\s+([\s\S]+?)\s+from/i);
    if (match) {
      return match[1].split(',').map(c => {
        const parts = c.trim().split(/\s+as\s+/i);
        const colName = parts[parts.length - 1];
        return colName.replace(/['"`\s]/g, '').split('.').pop()!.toLowerCase();
      });
    }
  }
  
  return [];
}

function formatQueryResult(text: any, localResult: any[]) {
  const isArrayMode = (text && typeof text === 'object' && (text as any).rowMode === 'array');
  let queryText = "";
  if (typeof text === 'object' && text !== null) {
    queryText = text.text || "";
  } else {
    queryText = text || "";
  }

  const cols = parseQueryColumns(queryText);
  
  const mappedRows = isArrayMode && cols.length > 0
    ? localResult.map(row => cols.map(col => getRowValue(row, col)))
    : localResult;

  const fields = cols.map(name => ({
    name,
    dataTypeID: 0
  }));

  return {
    rows: mappedRows,
    rowCount: localResult.length,
    command: queryText.split(" ")[0].toUpperCase(),
    oid: 0,
    fields
  };
}

function parseTableName(sql: string): string {
  const sqlLower = sql.toLowerCase();
  const tables = [
    "user", "transaction", "ledger_entry", "product", "account", "session", 
    "verificationToken", "order", "review", "audit_log", "system_health", "webhook_endpoint"
  ];
  
  for (const t of tables) {
    const regex = new RegExp(`(?:from|into|update|delete\\s+from|insert\\s+into)\\s+(?:"?public"?\\.)?"?${t}"?\\b`, "i");
    if (regex.test(sql)) {
      return t;
    }
  }

  const fallbackMatch = sql.match(/(?:from|into|update|delete\s+from|insert\s+into)\s+(?:"?public"?\\.)?"?([a-zA-Z_0-9]+)"?/i);
  if (fallbackMatch) {
    const matched = fallbackMatch[1].replace(/['"`]/g, '').toLowerCase();
    if (tables.includes(matched)) return matched;
    if (matched === "users") return "user";
    if (matched === "transactions") return "transaction";
    if (matched === "ledger_entries") return "ledger_entry";
    if (matched === "products") return "product";
    if (matched === "accounts") return "account";
    if (matched === "sessions") return "session";
    if (matched === "orders") return "order";
    if (matched === "reviews") return "review";
    if (matched === "audit_logs") return "audit_log";
    if (matched === "system_healths") return "system_health";
    if (matched === "webhook_endpoints") return "webhook_endpoint";
    return matched;
  }

  return "";
}

function emulateSqlQuery(sql: string, params: any[]) {
  const db = getLocalDb();
  const sqlLower = sql.toLowerCase();
  const table = parseTableName(sql);

  console.log(`[Resilient DB] Emulating SQL query locally on table "${table}": ${sql.slice(0, 120)}...`);

  // Robust parameter index finder matching quotes, prefixes, and aliases (e.g. "transaction"."user_id" = $1)
  const getParamIndex = (clause: string, colName: string): number | null => {
    const escapedCol = colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:"?\\w+"?\\.)?"?${escapedCol}"?\\s*=\\s*\\$(\\d+)`, 'i');
    const match = clause.match(regex);
    return match ? parseInt(match[1]) - 1 : null;
  };

  // 1. SELECT "user"
  if (sqlLower.includes('select') && table === 'user') {
    let result = db.users.map(u => ({
      ...u,
      emailVerified: u.emailVerified || u.email_verified,
      email_verified: u.emailVerified || u.email_verified,
      isAdmin: u.isAdmin || u.is_admin,
      is_admin: u.isAdmin || u.is_admin,
      securityLockdown: u.securityLockdown || u.security_lockdown,
      security_lockdown: u.securityLockdown || u.security_lockdown,
    }));
    const whereClause = sqlLower.split('where')[1] || "";
    
    const emailIdx = getParamIndex(whereClause, 'email');
    const idIdx = getParamIndex(whereClause, 'id');
    
    if (emailIdx !== null && emailIdx >= 0 && emailIdx < params.length) {
      const email = params[emailIdx]?.toLowerCase().trim();
      result = result.filter(u => u.email?.toLowerCase().trim() === email);
    } else if (idIdx !== null && idIdx >= 0 && idIdx < params.length) {
      const id = params[idIdx];
      result = result.filter(u => u.id === id);
    }
    if (sqlLower.includes('limit $') || sqlLower.includes('limit 1')) {
      return result.slice(0, 1);
    }
    return result;
  }

  // 2. SELECT "transaction"
  if (sqlLower.includes('select') && table === 'transaction') {
    let result = db.transactions.map(t => {
      const user = db.users.find(u => u.id === t.userId || u.id === t.user_id);
      return {
        ...t,
        userId: t.userId || t.user_id,
        user_id: t.userId || t.user_id,
        orderId: t.orderId || t.order_id,
        order_id: t.orderId || t.order_id,
        idempotencyKey: t.idempotencyKey || t.idempotency_key,
        idempotency_key: t.idempotencyKey || t.idempotency_key,
        previousHash: t.previousHash || t.previous_hash,
        previous_hash: t.previousHash || t.previous_hash,
        lockedUntil: t.lockedUntil || t.locked_until,
        locked_until: t.lockedUntil || t.locked_until,
        errorMessage: t.errorMessage || t.error_message,
        error_message: t.errorMessage || t.error_message,
        createdAt: t.createdAt || t.created_at,
        created_at: t.createdAt || t.created_at,
        completedAt: t.completedAt || t.completed_at,
        completed_at: t.completedAt || t.completed_at,
        userName: user ? user.name : null,
        userEmail: user ? user.email : null,
        user_name: user ? user.name : null,
        user_email: user ? user.email : null,
        users_name: user ? user.name : null,
        users_email: user ? user.email : null,
        "users.name": user ? user.name : null,
        "users.email": user ? user.email : null,
        "user.name": user ? user.name : null,
        "user.email": user ? user.email : null,
      };
    });
    const whereClause = sqlLower.split('where')[1] || "";
    
    const userIdx = getParamIndex(whereClause, 'user_id') ?? getParamIndex(whereClause, 'userid');
    const idempIdx = getParamIndex(whereClause, 'idempotency_key') ?? getParamIndex(whereClause, 'idempotencykey');
    
    if (userIdx !== null && userIdx >= 0 && userIdx < params.length) {
      const userId = params[userIdx];
      result = result.filter(t => t.userId === userId || t.user_id === userId);
    } else if (idempIdx !== null && idempIdx >= 0 && idempIdx < params.length) {
      const key = params[idempIdx];
      result = result.filter(t => t.idempotencyKey === key || t.idempotency_key === key);
    }
    if (sqlLower.includes('order by') && sqlLower.includes('created_at') && sqlLower.includes('desc')) {
      result.sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
    }
    if (sqlLower.includes('limit $') || sqlLower.includes('limit 1')) {
      return result.slice(0, 1);
    }
    return result;
  }

  // 3. SELECT "ledger_entry"
  if (sqlLower.includes('select') && table === 'ledger_entry') {
    let result = db.ledgerEntries.map(e => ({
      ...e,
      transactionId: e.transactionId || e.transaction_id,
      transaction_id: e.transactionId || e.transaction_id,
      userId: e.userId || e.user_id,
      user_id: e.userId || e.user_id,
      accountType: e.accountType || e.account_type,
      account_type: e.accountType || e.account_type,
      entryType: e.entryType || e.entry_type,
      entry_type: e.entryType || e.entry_type,
      createdAt: e.createdAt || e.created_at,
      created_at: e.createdAt || e.created_at,
    }));
    const whereClause = sqlLower.split('where')[1] || "";
    
    const userIdx = getParamIndex(whereClause, 'user_id') ?? getParamIndex(whereClause, 'userid');
    const txIdx = getParamIndex(whereClause, 'transaction_id') ?? getParamIndex(whereClause, 'transactionid');
    
    if (userIdx !== null && userIdx >= 0 && userIdx < params.length) {
      const userId = params[userIdx];
      result = result.filter(e => e.userId === userId || e.user_id === userId);
    } else if (txIdx !== null && txIdx >= 0 && txIdx < params.length) {
      const txId = params[txIdx];
      result = result.filter(e => e.transactionId === txId || e.transaction_id === txId);
    }
    return result;
  }

  // 4. SELECT "product"
  if (sqlLower.includes('select') && table === 'product') {
    return [...db.products];
  }

  // 5. INSERT INTO "user"
  if (sqlLower.includes('insert into') && table === 'user') {
    const columnsMatch = sql.match(/insert into\s+(?:"?public"?\.)?"?user"?\s*\(([^)]+)\)\s*values/i);
    const columns = columnsMatch 
      ? columnsMatch[1].split(',').map(c => c.replace(/['"`\s]/g, '')) 
      : [];

    const newUser: any = {
      id: `usr_${Math.random().toString(36).substring(7)}`,
      name: "User",
      email: "",
      password: null,
      emailVerified: null,
      email_verified: null,
      image: null,
      isAdmin: false,
      is_admin: false,
      securityLockdown: false,
      security_lockdown: false
    };

    mapParamsToColumns(sql, params, columns, newUser, (col, val) => {
      if (col === 'id') newUser.id = val;
      else if (col === 'name') newUser.name = val;
      else if (col === 'email') newUser.email = val?.toLowerCase().trim();
      else if (col === 'password') newUser.password = val;
      else if (col === 'emailverified' || col === 'email_verified') {
        newUser.emailVerified = val;
        newUser.email_verified = val;
      } else if (col === 'image') {
        newUser.image = val;
      } else if (col === 'isadmin' || col === 'is_admin') {
        newUser.isAdmin = val === true || val === 'true' || val === 1 || val === '1';
        newUser.is_admin = val === true || val === 'true' || val === 1 || val === '1';
      } else if (col === 'securitylockdown' || col === 'security_lockdown') {
        newUser.securityLockdown = val === true || val === 'true';
        newUser.security_lockdown = val === true || val === 'true';
      }
    });

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
    if (adminEmail && newUser.email?.toLowerCase().trim() === adminEmail) {
      newUser.isAdmin = true;
      newUser.is_admin = true;
    }

    db.users.push(newUser);
    saveLocalDb(db);
    return [newUser];
  }

  // 6. INSERT INTO "transaction"
  if (sqlLower.includes('insert into') && table === 'transaction') {
    const columnsMatch = sql.match(/insert into\s+(?:"?public"?\.)?"?transaction"?\s*\(([^)]+)\)\s*values/i);
    const columns = columnsMatch 
      ? columnsMatch[1].split(',').map(c => c.replace(/['"`\s]/g, '').toLowerCase()) 
      : [];

    const newTx: any = {
      id: `tx_${Math.random().toString(36).substring(2, 11)}`,
      userId: "",
      user_id: "",
      orderId: null,
      order_id: null,
      idempotencyKey: "",
      idempotency_key: "",
      amount: "0",
      status: "completed",
      hash: "",
      previousHash: null,
      previous_hash: null,
      metadata: {},
      lockedUntil: null,
      locked_until: null,
      errorMessage: null,
      error_message: null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    mapParamsToColumns(sql, params, columns, newTx, (col, val) => {
      if (col === 'id') newTx.id = val;
      else if (col === 'user_id' || col === 'userid') {
        newTx.userId = val;
        newTx.user_id = val;
      } else if (col === 'order_id' || col === 'orderid') {
        newTx.orderId = val;
        newTx.order_id = val;
      } else if (col === 'idempotency_key' || col === 'idempotencykey') {
        newTx.idempotencyKey = val;
        newTx.idempotency_key = val;
      } else if (col === 'amount') {
        newTx.amount = val?.toString() || "0";
      } else if (col === 'status') {
        newTx.status = val;
      } else if (col === 'hash') {
        newTx.hash = val;
      } else if (col === 'previous_hash' || col === 'previoushash') {
        newTx.previousHash = val;
        newTx.previous_hash = val;
      } else if (col === 'metadata') {
        let parsedVal = val;
        try {
          if (typeof val === 'string') parsedVal = JSON.parse(val);
        } catch (e) {}
        newTx.metadata = parsedVal;
      } else if (col === 'locked_until' || col === 'lockeduntil') {
        newTx.lockedUntil = val;
        newTx.locked_until = val;
      } else if (col === 'error_message' || col === 'errormessage') {
        newTx.errorMessage = val;
        newTx.error_message = val;
      } else if (col === 'created_at' || col === 'createdat') {
        newTx.createdAt = val;
        newTx.created_at = val;
      } else if (col === 'completed_at' || col === 'completedat') {
        newTx.completedAt = val;
        newTx.completed_at = val;
      }
    });

    db.transactions.push(newTx);
    saveLocalDb(db);
    return [newTx];
  }

  // 7. INSERT INTO "ledger_entry"
  if (sqlLower.includes('insert into') && table === 'ledger_entry') {
    const columnsMatch = sql.match(/insert into\s+(?:"?public"?\.)?"?ledger_entry"?\s*\(([^)]+)\)\s*values/i);
    const columns = columnsMatch 
      ? columnsMatch[1].split(',').map(c => c.replace(/['"`\s]/g, '').toLowerCase()) 
      : [];

    const newEntry: any = {
      id: `ent_${Math.random().toString(36).substring(2, 11)}`,
      transactionId: "",
      transaction_id: "",
      userId: "",
      user_id: "",
      accountType: "MAIN",
      account_type: "MAIN",
      entryType: "CREDIT",
      entry_type: "CREDIT",
      amount: "0",
      description: "",
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    mapParamsToColumns(sql, params, columns, newEntry, (col, val) => {
      if (col === 'id') newEntry.id = val;
      else if (col === 'transaction_id' || col === 'transactionid') {
        newEntry.transactionId = val;
        newEntry.transaction_id = val;
      } else if (col === 'user_id' || col === 'userid') {
        newEntry.userId = val;
        newEntry.user_id = val;
      } else if (col === 'account_type' || col === 'accounttype') {
        newEntry.accountType = val;
        newEntry.account_type = val;
      } else if (col === 'entry_type' || col === 'entrytype') {
        newEntry.entryType = val;
        newEntry.entry_type = val;
      } else if (col === 'amount') {
        newEntry.amount = val?.toString() || "0";
      } else if (col === 'description') {
        newEntry.description = val;
      } else if (col === 'created_at' || col === 'createdat') {
        newEntry.createdAt = val;
        newEntry.created_at = val;
      }
    });

    db.ledgerEntries.push(newEntry);
    saveLocalDb(db);
    return [newEntry];
  }

  // 8. UPDATE "user"
  if (sqlLower.includes('update') && table === 'user') {
    const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
    const sets = setMatch 
      ? setMatch[1].split(',').map(s => s.trim().split('=')[0].replace(/['"`\s]/g, ''))
      : [];

    let userIndex = -1;
    const whereClause = sqlLower.split('where')[1] || "";
    
    const idIdx = getParamIndex(whereClause, 'id');
    const emailIdx = getParamIndex(whereClause, 'email');
    
    if (idIdx !== null && idIdx >= 0 && idIdx < params.length) {
      const id = params[idIdx];
      userIndex = db.users.findIndex(u => u.id === id);
    } else if (emailIdx !== null && emailIdx >= 0 && emailIdx < params.length) {
      const email = params[emailIdx]?.toLowerCase().trim();
      userIndex = db.users.findIndex(u => u.email?.toLowerCase().trim() === email);
    } else {
      // Fallback to last parameter
      const fallbackVal = params[params.length - 1];
      if (typeof fallbackVal === 'string' && fallbackVal.includes('@')) {
        userIndex = db.users.findIndex(u => u.email?.toLowerCase().trim() === fallbackVal.toLowerCase().trim());
      } else {
        userIndex = db.users.findIndex(u => u.id === fallbackVal);
      }
    }

    if (userIndex !== -1) {
      const user = db.users[userIndex];
      sets.forEach((col, idx) => {
        const val = params[idx];
        if (val !== undefined) {
          if (col === 'password') user.password = val;
          else if (col === 'name') user.name = val;
          else if (col === 'email') user.email = val?.toLowerCase().trim();
          else if (col === 'isAdmin' || col === 'is_admin') user.isAdmin = val === true || val === 'true' || val === 1 || val === '1';
          else if (col === 'securityLockdown' || col === 'security_lockdown') user.security_lockdown = val === true || val === 'true';
        }
      });

      const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
      if (adminEmail && user.email?.toLowerCase().trim() === adminEmail) {
        user.isAdmin = true;
      }

      saveLocalDb(db);
      return [user];
    }
  }

  // 9. DELETE
  if (sqlLower.includes('delete from "ledger_entry"')) {
    const userId = params[0];
    db.ledgerEntries = db.ledgerEntries.filter(e => e.userId !== userId);
    saveLocalDb(db);
    return [];
  }
  if (sqlLower.includes('delete from "transaction"')) {
    const userId = params[0];
    db.transactions = db.transactions.filter(t => t.userId !== userId);
    saveLocalDb(db);
    return [];
  }
  if (sqlLower.includes('delete from "user"')) {
    const id = params[0];
    db.users = db.users.filter(u => u.id !== id);
    saveLocalDb(db);
    return [];
  }

  return [];
}

function normalizeQueryArgs(text: any, values: any, cb: any) {
  let queryText = "";
  let queryValues: any[] = [];
  let callbackFn: any = undefined;

  if (typeof text === "object" && text !== null) {
    queryText = text.text || "";
    queryValues = text.values || [];
    callbackFn = cb || text.callback;
    if (typeof values === "function") {
      callbackFn = values;
    } else if (Array.isArray(values)) {
      queryValues = values;
    }
  } else {
    queryText = text || "";
    if (typeof values === "function") {
      callbackFn = values;
      queryValues = [];
    } else {
      queryValues = Array.isArray(values) ? values : [];
      callbackFn = cb;
    }
  }

  return { queryText, queryValues, callbackFn };
}

// -----------------------------------------------------------------------------
// SUPABASE HTTP REST ENGINE (POSTGREST TRANSLATION SYSTEM)
// -----------------------------------------------------------------------------

function normalizeRowKeys(row: any) {
  if (!row || typeof row !== 'object') return row;
  
  const normalized: any = { ...row };
  
  if (row.user && typeof row.user === 'object') {
    normalized.userName = row.user.name;
    normalized.userEmail = row.user.email;
    normalized.user_name = row.user.name;
    normalized.user_email = row.user.email;
    normalized.users_name = row.user.name;
    normalized.users_email = row.user.email;
    normalized["users.name"] = row.user.name;
    normalized["users.email"] = row.user.email;
  }

  for (const key of Object.keys(row)) {
    const val = row[key];
    
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      for (const nestedKey of Object.keys(val)) {
        const nestedVal = val[nestedKey];
        normalized[`${key}_${nestedKey}`] = nestedVal;
        normalized[`${key}${nestedKey.charAt(0).toUpperCase()}${nestedKey.slice(1)}`] = nestedVal;
        normalized[`${key}.${nestedKey}`] = nestedVal;
        if (normalized[nestedKey] === undefined) {
          normalized[nestedKey] = nestedVal;
        }
      }
    }

    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (normalized[camelKey] === undefined) {
        normalized[camelKey] = val;
      }
    }
    
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (snakeKey !== key && normalized[snakeKey] === undefined) {
      normalized[snakeKey] = val;
    }
  }

  if (normalized.amount !== undefined && normalized.amount !== null) {
    try {
      normalized.amount = BigInt(normalized.amount);
    } catch (e) {}
  }
  
  for (const k of Object.keys(normalized)) {
    if (k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('_at')) {
      const dateVal = normalized[k];
      if (typeof dateVal === 'string' && !isNaN(Date.parse(dateVal))) {
        normalized[k] = new Date(dateVal);
      }
    }
  }

  return normalized;
}

async function fetchSupabaseTable(table: string, urlParams: string = ""): Promise<any[]> {
  const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lyhgfezubrbgikuxhcug.supabase.co");
  const supabaseKey = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const url = `${supabaseUrl}/rest/v1/${table}?${urlParams}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${table} failed: ${text}`);
  }
  return response.json();
}

async function executeSupabaseRest(sql: string, params: any[]): Promise<any[]> {
  const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lyhgfezubrbgikuxhcug.supabase.co");
  const supabaseKey = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or Key environment variables are missing");
  }

  const sqlLower = sql.toLowerCase();
  const sqlTrim = sqlLower.trim();

  // Bypass Transaction Control SQL immediately
  if (
    ["begin", "commit", "rollback", "abort", "start transaction"].includes(sqlTrim) ||
    sqlTrim.startsWith("begin ") ||
    sqlTrim.startsWith("commit ") ||
    sqlTrim.startsWith("rollback ") ||
    sqlTrim.startsWith("abort ")
  ) {
    console.log(`[Supabase REST Bypass] Bypassed transaction control statement: "${sql}"`);
    return [];
  }

  let table = "";
  const tables = [
    "user", "transaction", "ledger_entry", "product", "account", "session", 
    "verificationToken", "order", "review", "audit_log", "system_health", "webhook_endpoint"
  ];
  
  for (const t of tables) {
    const regex = new RegExp(`(?:from|into|update|delete\\s+from)\\s+["']?${t}["']?`, "i");
    if (regex.test(sql)) {
      table = t;
      break;
    }
  }

  if (!table) {
    const tableMatch = sql.match(/(?:from|into|update|delete\s+from)\s+["']?([a-zA-Z_0-9]+)["']?/i);
    if (tableMatch) {
      table = tableMatch[1];
    }
  }

  if (!table) {
    if (sqlLower.includes("create table") || sqlLower.includes("alter table")) {
      return [];
    }
    throw new Error(`Could not parse table name from query: ${sql}`);
  }

  table = table.replace(/['"`]/g, '');

  let url = `${supabaseUrl}/rest/v1/${table}`;
  let method = "GET";
  let body: any = null;
  const headers: Record<string, string> = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  // 1. Join operations
  if (sqlLower.includes("left join")) {
    let joinedTable = "";
    for (const t of tables) {
      if (t !== table && new RegExp(`left\\s+join\\s+["']?${t}["']?`, "i").test(sql)) {
        joinedTable = t;
        break;
      }
    }

    let primaryParams = "select=*";
    const whereMatch = sql.match(/where\s+([\s\S]+?)(?:order\s+by|limit|$)/i);
    if (whereMatch) {
      const wherePart = whereMatch[1];
      const matches = wherePart.matchAll(/([a-zA-Z_0-9."'-]+)\s*=\s*\$(\d+)/g);
      for (const match of matches) {
        const rawCol = match[1];
        const paramIdx = parseInt(match[2]) - 1;
        const val = params[paramIdx];
        if (val !== undefined && val !== null) {
          const colName = rawCol.replace(/['"`]/g, '').split('.').pop()!;
          primaryParams += `&${colName}=eq.${encodeURIComponent(val.toString())}`;
        }
      }
    }

    if (sqlLower.includes('order by')) {
      const orderPart = sql.split(/order\s+by/i)[1] || "";
      const orderMatch = orderPart.match(/([a-zA-Z_0-9."'-]+)\s+(desc|asc)/i);
      if (orderMatch) {
        const colName = orderMatch[1].replace(/['"`]/g, '').split('.').pop()!;
        const direction = orderMatch[2].toLowerCase();
        primaryParams += `&order=${colName}.${direction}`;
      }
    }

    if (sqlLower.includes('limit')) {
      const limitPart = sql.split(/limit/i)[1]?.trim() || "";
      const limitValMatch = limitPart.match(/^(\d+)/);
      if (limitValMatch) {
        primaryParams += `&limit=${limitValMatch[1]}`;
      } else {
        const limitParamMatch = limitPart.match(/^\$(\d+)/);
        if (limitParamMatch) {
          const paramIdx = parseInt(limitParamMatch[1]) - 1;
          const val = params[paramIdx];
          if (val !== undefined) {
            primaryParams += `&limit=${val}`;
          }
        }
      }
    }

    console.log(`[Supabase REST Join] Fetching table "${table}" and joined table "${joinedTable}"...`);
    const primaryRows = await fetchSupabaseTable(table, primaryParams);
    let joinedRows: any[] = [];
    if (joinedTable) {
      try {
        joinedRows = await fetchSupabaseTable(joinedTable);
      } catch (err) {
        console.warn(`[Supabase REST Join] Failed to fetch joined table "${joinedTable}":`, err);
      }
    }

    const mergedRows = primaryRows.map((row: any) => {
      const matched = joinedRows.find((j: any) => j.id === row.user_id || j.id === row.userId);
      return {
        ...row,
        [joinedTable]: matched || null
      };
    });

    return mergedRows.map(normalizeRowKeys);
  }

  // 2. Standard Operations
  if (sqlLower.includes("select")) {
    method = "GET";
    url += "?select=*";

    const whereMatch = sql.match(/where\s+([\s\S]+?)(?:order\s+by|limit|$)/i);
    if (whereMatch) {
      const wherePart = whereMatch[1];
      const matches = wherePart.matchAll(/([a-zA-Z_0-9."'-]+)\s*=\s*\$(\d+)/g);
      for (const match of matches) {
        const rawCol = match[1];
        const paramIdx = parseInt(match[2]) - 1;
        const val = params[paramIdx];
        if (val !== undefined && val !== null) {
          const colName = rawCol.replace(/['"`]/g, '').split('.').pop()!;
          url += `&${colName}=eq.${encodeURIComponent(val.toString())}`;
        }
      }
    }

    if (sqlLower.includes('order by')) {
      const orderPart = sql.split(/order\s+by/i)[1] || "";
      const orderMatch = orderPart.match(/([a-zA-Z_0-9."'-]+)\s+(desc|asc)/i);
      if (orderMatch) {
        const colName = orderMatch[1].replace(/['"`]/g, '').split('.').pop()!;
        const direction = orderMatch[2].toLowerCase();
        url += `&order=${colName}.${direction}`;
      } else {
        const colMatch = orderPart.match(/([a-zA-Z_0-9."'-]+)/);
        if (colMatch) {
          const colName = colMatch[1].replace(/['"`]/g, '').split('.').pop()!;
          url += `&order=${colName}.asc`;
        }
      }
    }

    if (sqlLower.includes('limit')) {
      const limitPart = sql.split(/limit/i)[1]?.trim() || "";
      const limitValMatch = limitPart.match(/^(\d+)/);
      if (limitValMatch) {
        url += `&limit=${limitValMatch[1]}`;
      } else {
        const limitParamMatch = limitPart.match(/^\$(\d+)/);
        if (limitParamMatch) {
          const paramIdx = parseInt(limitParamMatch[1]) - 1;
          const val = params[paramIdx];
          if (val !== undefined) {
            url += `&limit=${val}`;
          }
        }
      }
    }

  } else if (sqlLower.includes("insert into")) {
    method = "POST";
    const columnsMatch = sql.match(/insert\s+into\s+[\s\S]+?\(([^)]+)\)\s*values/i);
    if (columnsMatch) {
      const columns = columnsMatch[1].split(',').map(c => c.replace(/['"`\s]/g, ''));
      const valuesPart = sql.substring(sql.toLowerCase().indexOf('values') + 6).trim();
      const blocks = valuesPart.match(/\(([^)]+)\)/g) || [];
      
      const insertRecords: any[] = [];
      if (blocks.length > 0) {
        blocks.forEach((block) => {
          const exprs = block.replace(/[()]/g, '').split(',').map(e => e.trim());
          const record: any = {};
          columns.forEach((col, idx) => {
            const expr = exprs[idx];
            if (expr && expr.startsWith('$')) {
              const paramIdx = parseInt(expr.substring(1)) - 1;
              const val = params[paramIdx];
              if (val !== undefined) {
                record[col] = val;
              }
            }
          });
          insertRecords.push(record);
        });
      }
      
      body = insertRecords.length === 1 ? insertRecords[0] : insertRecords;
    } else {
      throw new Error(`Could not parse INSERT columns from SQL: ${sql}`);
    }

    if (sqlLower.includes("on conflict")) {
      headers["Prefer"] = "resolution=merge-duplicates,return=representation";
    }

  } else if (sqlLower.includes("update")) {
    method = "PATCH";
    
    const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
    if (setMatch) {
      const setPart = setMatch[1];
      const setExprs = setPart.split(',').map(s => s.trim());
      const updateBody: any = {};
      
      setExprs.forEach((expr) => {
        const parts = expr.split('=');
        if (parts.length === 2) {
          const colName = parts[0].replace(/['"`\s]/g, '').split('.').pop()!;
          const right = parts[1].trim();
          if (right.startsWith('$')) {
            const paramIdx = parseInt(right.substring(1)) - 1;
            const val = params[paramIdx];
            if (val !== undefined) {
              updateBody[colName] = val;
            }
          }
        }
      });
      body = updateBody;
    } else {
      throw new Error(`Could not parse UPDATE SET clause from SQL: ${sql}`);
    }

    const wherePart = sql.split(/where/i)[1] || "";
    const matches = wherePart.matchAll(/([a-zA-Z_0-9."'-]+)\s*=\s*\$(\d+)/g);
    let filterAdded = false;
    url += "?";
    for (const match of matches) {
      const rawCol = match[1];
      const paramIdx = parseInt(match[2]) - 1;
      const val = params[paramIdx];
      if (val !== undefined && val !== null) {
        const colName = rawCol.replace(/['"`]/g, '').split('.').pop()!;
        url += `${filterAdded ? '&' : ''}${colName}=eq.${encodeURIComponent(val.toString())}`;
        filterAdded = true;
      }
    }

  } else if (sqlLower.includes("delete from")) {
    method = "DELETE";
    headers["Confirm"] = "true";

    const wherePart = sql.split(/where/i)[1] || "";
    const matches = wherePart.matchAll(/([a-zA-Z_0-9."'-]+)\s*=\s*\$(\d+)/g);
    let filterAdded = false;
    url += "?";
    for (const match of matches) {
      const rawCol = match[1];
      const paramIdx = parseInt(match[2]) - 1;
      const val = params[paramIdx];
      if (val !== undefined && val !== null) {
        const colName = rawCol.replace(/['"`]/g, '').split('.').pop()!;
        url += `${filterAdded ? '&' : ''}${colName}=eq.${encodeURIComponent(val.toString())}`;
        filterAdded = true;
      }
    }
  } else {
    throw new Error(`Unsupported SQL command in Supabase REST translator: ${sql}`);
  }

  console.log(`[Supabase REST] ${method} ${url.slice(0, 120)}`);
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body, (key, val) => typeof val === "bigint" ? Number(val) : val) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Supabase REST Error] HTTP ${response.status}: ${errorText}`);
    if (sqlLower.includes("on conflict") && response.status === 409) {
      return [];
    }
    throw new Error(`Supabase REST API returned ${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  if (!responseText) return [];
  
  const resultData = JSON.parse(responseText);
  const normalizedResult = Array.isArray(resultData) ? resultData : [resultData];
  
  return normalizedResult.map(normalizeRowKeys);
}

// -----------------------------------------------------------------------------
// POSTGRES PROTOTYPE OVERRIDES
// -----------------------------------------------------------------------------

const originalQuery = Pool.prototype.query;
// @ts-ignore
Pool.prototype.query = function (text, values, callback) {
  const { queryText, queryValues, callbackFn } = normalizeQueryArgs(text, values, callback);

  const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (supabaseUrl && supabaseKey) {
    const promise = executeSupabaseRest(queryText, queryValues)
      .then((restResult) => {
        return formatQueryResult(text, restResult);
      })
      .catch((err) => {
        console.error("❌ [Supabase REST Redirect Failure] Fallback to local dev database:", err.message);
        const localResult = emulateSqlQuery(queryText, queryValues);
        return formatQueryResult(text, localResult);
      });

    if (typeof callbackFn === "function") {
      promise.then(
        (res) => callbackFn(null, res),
        (err) => callbackFn(err)
      );
      return this;
    }
    return promise;
  }

  try {
    const localResult = emulateSqlQuery(queryText, queryValues);
    const res = formatQueryResult(text, localResult);
    if (typeof callbackFn === "function") {
      callbackFn(null, res);
      return this;
    }
    return Promise.resolve(res);
  } catch (emulateErr: any) {
    if (typeof callbackFn === "function") {
      callbackFn(emulateErr);
      return this;
    }
    return Promise.reject(emulateErr);
  }
};

const originalConnect = Pool.prototype.connect;
// @ts-ignore
Pool.prototype.connect = async function (callback) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  const mockClient = {
    query: function (text: any, values: any, cb: any) {
      const { queryText, queryValues, callbackFn } = normalizeQueryArgs(text, values, cb);

      if (supabaseUrl && supabaseKey) {
        const promise = executeSupabaseRest(queryText, queryValues)
          .then((restResult) => {
            return formatQueryResult(text, restResult);
          })
          .catch((err) => {
            console.error("❌ [Supabase REST Client Redirect Failure] Fallback to local database:", err.message);
            const localResult = emulateSqlQuery(queryText, queryValues);
            return formatQueryResult(text, localResult);
          });

        if (typeof callbackFn === "function") {
          promise.then(
            (res) => callbackFn(null, res),
            (err) => callbackFn(err)
          );
          return mockClient;
        }
        return promise;
      }

      try {
        const localResult = emulateSqlQuery(queryText, queryValues);
        const res = formatQueryResult(text, localResult);
        if (typeof callbackFn === "function") {
          callbackFn(null, res);
          return mockClient;
        }
        return Promise.resolve(res);
      } catch (emulateErr: any) {
        if (typeof callbackFn === "function") {
          callbackFn(emulateErr);
          return mockClient;
        }
        return Promise.reject(emulateErr);
      }
    },
    release: () => {},
    on: () => {},
    once: () => {},
    emit: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    off: () => {}
  };

  if (typeof callback === "function") {
    callback(null, mockClient as any, () => {});
  }
  return mockClient as any;
};

const globalForDb = global as unknown as { pool: Pool | undefined };

if (!globalForDb.pool) {
  globalForDb.pool = new Pool({
    connectionString,
    ssl: connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1") 
      ? false 
      : { rejectUnauthorized: false }, 
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 1000,
  });

  globalForDb.pool.on("error", (err) => {
    console.error("Unexpected database pool connection drop error:", err);
  });
}

export const db = drizzle(globalForDb.pool, { schema });
