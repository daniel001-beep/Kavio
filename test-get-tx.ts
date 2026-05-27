import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const req = new Request('http://localhost:3000/api/ledger/transaction', {
    method: 'GET',
    headers: {
      'Cookie': 'velox-local-user=%7B%22id%22%3A%22usr_6wshej3ht%22%2C%22email%22%3A%22idowuisdaniel1%40gmail.com%22%2C%22name%22%3A%22Idowu%20Daniel%22%2C%22isAdmin%22%3Atrue%7D; sb-access-token=mock-token'
    }
  });

  const { GET } = await import('./app/api/ledger/transaction/route.ts');
  
  const res = await GET(req);
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response data:', data);
}

main();
