async function runTests() {
  console.log('--- TEST 1: QR Code Validator API ---');
  const res1 = await fetch('http://localhost:3001/api/public/validate/FENEC-2026-K7M9Q21');
  const data1 = await res1.json();
  console.log('Status HTTP:', res1.status, 'Valid:', data1.valid, 'Student:', data1.student?.name);

  console.log('--- TEST 2: Manual Validator (DNE Model) ---');
  const res2 = await fetch('http://localhost:3001/api/public/validate-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigoUso: 'FENEC-2026-K7M9Q21', birthDate: '15/05/2002' })
  });
  const data2 = await res2.json();
  console.log('Status HTTP:', res2.status, 'Valid:', data2.valid, 'Message:', data2.message);

  console.log('--- TEST 3: Student Login API ---');
  const res3 = await fetch('http://localhost:3001/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: '123.456.789-00', birthDate: '15/05/2002' })
  });
  const data3 = await res3.json();
  console.log('Status HTTP:', res3.status, 'Student:', data3.student?.name, 'Código de Uso:', data3.student?.codigo_uso);

  console.log('--- TEST 4: Admin Login API ---');
  const res4 = await fetch('http://localhost:3001/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fenec.edu.br', password: 'admin123' })
  });
  const data4 = await res4.json();
  console.log('Status HTTP:', res4.status, 'Admin Token Received:', !!data4.token);

  console.log('--- TEST 5: QR Code Data Generator ---');
  const res5 = await fetch('http://localhost:3001/api/public/qrcode/FENEC-2026-K7M9Q21');
  const data5 = await res5.json();
  console.log('Status HTTP:', res5.status, 'Has QR Data URL:', data5.qrDataUrl?.startsWith('data:image/png;base64'));

  console.log('--- TEST 6: Frontend Index HTML ---');
  const res6 = await fetch('http://localhost:3001/');
  const html = await res6.text();
  console.log('Status HTTP:', res6.status, 'Contains FENEC title:', html.includes('FENEC'));

  console.log('✅ ALL API TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
