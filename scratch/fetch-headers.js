const https = require('https');

https.get('https://lyhgfezubrbgikuxhcug.supabase.co', (res) => {
  console.log("Headers:", res.headers);
}).on('error', (e) => {
  console.error(e);
});
