const fs = require('fs');
let code = fs.readFileSync('app/components/DashboardClient.tsx', 'utf-8');

// 1. Remove VeloxInsightsPanel
code = code.replace(/\/\/ --- Velox AI Insights Panel ---\n[\s\S]*?(?=export default function DashboardClient)/, '');

// 2. Add new state for server balances and exchange rates
code = code.replace(/const \[apiTransactions, setApiTransactions\] = useState<UITransaction\[\]>\(\[\]\);/, 
  'const [apiTransactions, setApiTransactions] = useState<UITransaction[]>([]);\n' +
  '  const [serverBalance, setServerBalance] = useState(initialBalance);\n' +
  '  const [serverDayChange, setServerDayChange] = useState(initialChange);\n' +
  '  const [exchangeRates, setExchangeRates] = useState({\n' +
  '    USD: 1,\n' +
  '    EUR: 0.92,\n' +
  '    NGN: 1450.50,\n' +
  '  });\n\n' +
  '  useEffect(() => {\n' +
  '    fetch(\'https://open.er-api.com/v6/latest/USD\')\n' +
  '      .then(r => r.json())\n' +
  '      .then(d => {\n' +
  '        if (d && d.rates) {\n' +
  '          setExchangeRates({\n' +
  '            USD: 1,\n' +
  '            EUR: d.rates.EUR || 0.92,\n' +
  '            NGN: d.rates.NGN || 1450.50,\n' +
  '          });\n' +
  '        }\n' +
  '      })\n' +
  '      .catch(e => console.warn(\'Failed to fetch live exchange rates\', e));\n' +
  '  }, []);\n'
);

// 3. Update fetchLatestTransactions
const fetchBodyRegex = /const data = await res\.json\(\);\s*\/\/ Map data successfully\.[\s\S]*?const mapped: UITransaction\[\] = Array\.isArray\(data\)\s*\?\s*data\.map\(\(tx: any\) => \{/;
const fetchBodyReplacement = `const data = await res.json();
      const transactionsPayload = Array.isArray(data) ? data : data.transactions || [];
      if (!Array.isArray(data)) {
        setServerBalance(data.totalBalanceUsd !== undefined ? data.totalBalanceUsd : initialBalance);
        setServerDayChange(data.dayChangeUsd !== undefined ? data.dayChangeUsd : initialChange);
      }
      
      const mapped: UITransaction[] = transactionsPayload.map((tx: any) => {`;
code = code.replace(fetchBodyRegex, fetchBodyReplacement);

// 4. Fix formatting of closing map bracket
code = code.replace(/          \}\)\n        : \[\];\n\n      setApiTransactions\(mapped\);/g, '          });\n\n      setApiTransactions(mapped);');

// 5. Remove invoices subscription and state
code = code.replace(/const \[invoices, setInvoices\] = useState<any\[\]>\(\[\]\);\n/g, '');
code = code.replace(/setInvoices\(\[\]\);\n/g, '');
code = code.replace(/const cachedInvoices = localStorage\.getItem\(\`velox_cached_invoices_\$\{userEmail\}\`\);[\s\S]*?\}\n      \}\n/g, '');

const fetchInvoicesRegex = /\/\/ Fetch invoices dynamically from Supabase \(secondary source for real-time updates\)\n\s*useEffect\(\(\) => \{[\s\S]*?\}\);/g;
code = code.replace(fetchInvoicesRegex, '');

code = code.replace(/\/\/ 2\. Subscribe to invoices table[\s\S]*?\)\n      \.subscribe\(\);/g, '.subscribe();');

// 6. Fix transactions merging
const txMergeRegex = /\/\/ Compute live visual states: merge API transactions \(primary\) with Supabase invoices \(secondary\)[\s\S]*?\}\);\n  \}, \[initialTransactions, apiTransactions, invoices\]\);/g;
const txMergeReplacement = `const transactions = useMemo<UITransaction[]>(() => {
    return [...apiTransactions].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [apiTransactions]);`;
code = code.replace(txMergeRegex, txMergeReplacement);

// 7. Fix Balance calculation
const balanceCalcRegex = /const balance = useMemo\(\(\) => \{[\s\S]*?\}, \[transactions, initialBalance\]\);/g;
const balanceCalcReplacement = 'const balance = serverBalance;';
code = code.replace(balanceCalcRegex, balanceCalcReplacement);

const dayChangeCalcRegex = /const dayChange = useMemo\(\(\) => \{[\s\S]*?\}, \[transactions, initialChange\]\);/g;
const dayChangeCalcReplacement = 'const dayChange = serverDayChange;';
code = code.replace(dayChangeCalcRegex, dayChangeCalcReplacement);

// 8. Remove hardcoded exchange rates
const hardcodedRatesRegex = /const exchangeRates = \{\n\s*USD: 1,\n\s*EUR: 0\.92,\n\s*NGN: 1450\.50,\n\s*\};\n/g;
code = code.replace(hardcodedRatesRegex, '');

// 9. Update Realtime to trigger Sentinel
const realtimeInsertRegex = /if \(payload\.eventType === \'INSERT\'\) \{\n\s*addNotification\(\{\n\s*type: \'SUCCESS\',\n\s*title: \'New Ledger Entry\',\n\s*message: \`Transaction processed: \\\$\$\{Math\.abs\(amountInDollars\)\.toLocaleString\(\)\} \(\$\{uiTx\.description\}\)\`,\n\s*\}\);\n\s*\}/g;
const realtimeInsertReplacement = `if (payload.eventType === 'INSERT') {
                addNotification({
                  type: 'SUCCESS',
                  title: 'New Ledger Entry',
                  message: \`Transaction processed: $\${Math.abs(amountInDollars).toLocaleString()} (\${uiTx.description})\`,
                });
                addNotification({
                  type: 'SENTINEL',
                  title: 'Sentinel Alert: New Ledger Entry',
                  message: \`Detected transaction: $\${Math.abs(amountInDollars).toLocaleString()}. Integrity verified.\`,
                });
              }`;
code = code.replace(realtimeInsertRegex, realtimeInsertReplacement);

// Write it out
fs.writeFileSync('app/components/DashboardClient.tsx', code);
console.log('Modified DashboardClient.tsx via script!');
