const dns = require('dns');

function lookup(domain) {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (err, address, family) => {
      if (err) resolve({ domain, error: err.message });
      else resolve({ domain, address, family });
    });
  });
}

async function main() {
  const domains = [
    'lyhgfezubrbgikuxhcug.supabase.co',
    'db.lyhgfezubrbgikuxhcug.supabase.co',
  ];
  
  for (const d of domains) {
    const res = await lookup(d);
    console.log(JSON.stringify(res, null, 2));
  }
}

main();
