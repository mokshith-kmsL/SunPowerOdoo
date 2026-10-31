import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';

// ── helpers ────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, step = 0.5) => {
  const steps = Math.floor((max - min) / step);
  return +(min + Math.floor(Math.random() * steps) * step).toFixed(1);
};

// ── reference data ─────────────────────────────────────────────
const FIRST_NAMES = [
  'Amit','Anjali','Arjun','Ashok','Deepa','Dinesh','Divya','Ganesh','Geeta',
  'Harish','Indira','Jagdish','Kavitha','Kiran','Lakshmi','Manoj','Meena',
  'Mohan','Nalini','Naveen','Nilesh','Padma','Prakash','Preethi','Priya',
  'Rahul','Rajesh','Ramesh','Rekha','Rohit','Sandeep','Sanjay','Shweta',
  'Sneha','Sunil','Sunita','Suresh','Sushma','Usha','Vijay','Vikram',
  'Vishal','Yash','Zara','Tanvi','Pooja','Karthik','Aditya','Sonia','Hemant'
];
const LAST_NAMES = [
  'Sharma','Verma','Gupta','Patel','Singh','Kumar','Mehta','Joshi','Pillai',
  'Nair','Iyer','Menon','Reddy','Rao','Naik','Shetty','Patil','Jain','Agarwal',
  'Mishra','Tiwari','Dubey','Saxena','Pandey','Yadav','Kapoor','Bansal','Khanna',
  'Aggarwal','Bhatt','Deshpande','Krishnan','Subramaniam','Chakraborty','Gopinath',
  'Nambiar','Bhaskar','Muthukumar','Venkat','Srivastava'
];
const CITIES = [
  ['Mumbai','MH'],['Delhi','DL'],['Bengaluru','KA'],['Hyderabad','TS'],
  ['Ahmedabad','GJ'],['Chennai','TN'],['Kolkata','WB'],['Pune','MH'],
  ['Jaipur','RJ'],['Lucknow','UP'],['Noida','UP'],['Gurgaon','HR'],
  ['Chandigarh','HR'],['Indore','MP'],['Nagpur','MH'],['Vadodara','GJ'],
  ['Patna','BR'],['Bhopal','MP'],['Surat','GJ'],['Coimbatore','TN'],
  ['Madurai','TN'],['Visakhapatnam','AP'],['Kochi','KL'],['Thiruvananthapuram','KL'],
  ['Thrissur','KL'],['Kozhikode','KL'],['Mangaluru','KA'],['Mysuru','KA'],
  ['Nashik','MH'],['Aurangabad','MH']
];
const AREAS = ['Sector 12','Anna Nagar','Jubilee Hills','Koramangala','Vastrapur',
  'Salt Lake','Civil Lines','Panchkula','Shivaji Nagar','Banjara Hills','Malleswaram',
  'Alkapuri','Raja Park','Kothrud','Borivali','Marathahalli','Gomti Nagar',
  'Navlakha','Kaloor','Punjabi Bagh','Kukatpally','Rohini','Adyar','Nungambakkam',
  'Hazratganj','T Nagar','Tilak Nagar','Prahladnagar','Karvenagar','Yelahanka'];
const SOURCES  = ['Website','Referral','Exhibition','Social','Cold Call','Newspaper'];
const STATUSES = ['NEW','CONTACTED','SURVEY_SCHEDULED','SURVEY_DONE','QUOTED','NEGOTIATING','WON','LOST'];
const SYS_TYPES = ['ON_GRID','OFF_GRID'];
const DIRECTIONS = ['South','South-East','South-West'];
const FAULT_CODES = ['INV-E01','INV-E02','INV-E03','PNL-001','BAT-001','MTR-001',null,null,null];
const TICKET_DESCS = [
  'Inverter not syncing to grid.',
  'System output lower than expected.',
  'App monitoring not updating.',
  'Panel showing reduced generation.',
  'Battery draining faster than expected.',
  'Net meter reading incorrect.',
  'Inverter restarting randomly.',
  'Physical damage to panel frame.',
  'Loose mounting bracket noticed.',
  'Error code on inverter display.',
];
const EXPENSE_CATS = ['Transportation','Labour','Miscellaneous','Equipment','Commissioning'];
const EXPENSE_DESCS = {
  Transportation: ['Truck hire for delivery','Vehicle hire','Transport to site','Logistics cost'],
  Labour:         ['Installation crew wages','Technician day rate','Labour charges'],
  Miscellaneous:  ['Consumables and fasteners','Cable ties and conduit','Earthing materials'],
  Equipment:      ['Additional tools hire','Drill and mounting kit'],
  Commissioning:  ['Grid connection fee','Net meter installation charge'],
};

async function main() {
  console.log('Starting test data generation...');

  // ── 1. Get current max IDs ──────────────────────────────────
  const [
    { rows: [{ max: maxCust }] },
    { rows: [{ max: maxLead }] },
    { rows: [{ max: maxSurv }] },
    { rows: [{ max: maxQuot }] },
    { rows: [{ max: maxOrd  }] },
    { rows: [{ max: maxPay  }] },
    { rows: [{ max: maxSN   }] },
    { rows: sales },
    { rows: techs },
    { rows: pkgs  },
  ] = await Promise.all([
    db.query('SELECT MAX(id) FROM customers'),
    db.query('SELECT MAX(id) FROM leads'),
    db.query('SELECT MAX(id) FROM surveys'),
    db.query('SELECT MAX(id) FROM quotations'),
    db.query('SELECT MAX(id) FROM orders'),
    db.query('SELECT MAX(id) FROM payments'),
    db.query('SELECT MAX(id) FROM serial_numbers'),
    db.query("SELECT id FROM users WHERE role IN ('SALES','ADMIN') AND is_active=true"),
    db.query('SELECT id FROM technicians'),
    db.query('SELECT id, capacity_kw, system_type, base_price FROM packages'),
  ]);

  let custBase = parseInt(maxCust || 0);
  let leadBase = parseInt(maxLead || 0);
  let survBase = parseInt(maxSurv || 0);
  let quotBase = parseInt(maxQuot || 0);
  let ordBase  = parseInt(maxOrd  || 0);
  let payBase  = parseInt(maxPay  || 0);
  let snBase   = parseInt(maxSN   || 0);

  const salesIds = sales.map(r => r.id);
  const techIds  = techs.map(r => r.id);

  // ── 2. Insert 100 customers ────────────────────────────────
  console.log('Adding 100 customers...');
  const newCustomerIds = [];
  for (let i = 0; i < 100; i++) {
    const first = rand(FIRST_NAMES);
    const last  = rand(LAST_NAMES);
    const [city, state] = rand(CITIES);
    const area  = rand(AREAS);
    const phone = `+91-9${String(randInt(100000000, 999999999))}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${randInt(10,99)}@gmail.com`;
    const addr  = `${randInt(1,99)}, ${area}, ${city}, ${state}`;
    const { rows: [c] } = await db.query(
      'INSERT INTO customers (name, phone, email, address) VALUES ($1,$2,$3,$4) RETURNING id',
      [`${first} ${last}`, phone, email, addr]
    );
    newCustomerIds.push(c.id);
  }
  console.log(`Customers done. New IDs: ${newCustomerIds[0]}–${newCustomerIds[newCustomerIds.length-1]}`);

  // ── 3. Insert 120 leads ────────────────────────────────────
  console.log('Adding 120 leads...');
  const wonLeadData = []; // { leadId, customerId, capacity, sysType }
  for (let i = 0; i < 120; i++) {
    const custId   = rand(newCustomerIds);
    const capacity = rand([3.00, 5.00, 7.50, 10.00]);
    const sysType  = rand(SYS_TYPES);
    const status   = rand(STATUSES);
    const source   = rand(SOURCES);
    const bill     = randInt(2000, 12000);
    const roof     = randInt(150, 1000);
    const subsidy  = Math.random() > 0.5;
    const { rows: [l] } = await db.query(
      `INSERT INTO leads (customer_id, capacity_kw, system_type, monthly_electricity_bill, roof_area, subsidy_required, source, status, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [custId, capacity, sysType, bill, roof, subsidy, source, status, rand(salesIds)]
    );
    if (status === 'WON') {
      wonLeadData.push({ leadId: l.id, customerId: custId, capacity, sysType });
    }
  }
  console.log(`Leads done. WON leads: ${wonLeadData.length}`);

  // ── 4. Insert surveys for WON leads (up to 50) ────────────
  console.log('Adding surveys for WON leads...');
  const approvedSurveys = []; // { surveyId, customerId, capacity, sysType }
  const surveyLeads = wonLeadData.slice(0, 50);
  for (const { leadId, customerId, capacity, sysType } of surveyLeads) {
    const techId = rand(techIds);
    const roofArea = randInt(180, 1000);
    const month = randInt(7, 10).toString().padStart(2,'0');
    const day   = randInt(1, 28).toString().padStart(2,'0');
    const { rows: [s] } = await db.query(
      `INSERT INTO surveys (customer_id, technician_id, lead_id, scheduled_date, roof_area, shadow_free_area, roof_direction, roof_tilt, cable_distance, grid_suitable, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'APPROVED') RETURNING id`,
      [customerId, techId, leadId, `2026-${month}-${day}`,
       roofArea, Math.floor(roofArea * 0.92),
       rand(DIRECTIONS), randInt(8,20), randInt(12,40),
       sysType === 'ON_GRID',
       'Site assessed and approved by technician.']
    );
    approvedSurveys.push({ surveyId: s.id, customerId, capacity, sysType });
  }
  console.log(`Surveys done: ${approvedSurveys.length}`);

  // ── 5. Insert quotations (up to 40) ───────────────────────
  console.log('Adding quotations...');
  const convertedQuots = []; // { quotId, customerId, total, capacity, sysType }
  const quotSurveys = approvedSurveys.slice(0, 40);
  for (const { surveyId, customerId, capacity, sysType } of quotSurveys) {
    const pkg = pkgs.find(p =>
      parseFloat(p.capacity_kw) === capacity && p.system_type === sysType
    ) || pkgs.find(p => parseFloat(p.capacity_kw) === capacity) || rand(pkgs);

    const subtotal  = parseFloat(pkg.base_price);
    const discount  = randInt(0, 3) * 5000;
    const taxable   = subtotal - discount;
    const tax       = +(taxable * 0.18).toFixed(2);
    const total     = +(taxable + tax).toFixed(2);
    const isConverted = Math.random() > 0.35;
    const status    = isConverted ? 'CONVERTED' : rand(['APPROVED','SENT','DRAFT']);

    const { rows: [q] } = await db.query(
      `INSERT INTO quotations (customer_id, survey_id, package_id, capacity_kw, system_type, subtotal, tax, discount, total, status, valid_until, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'2026-12-31',$11) RETURNING id`,
      [customerId, surveyId, pkg.id, capacity, sysType, subtotal, tax, discount, total, status, rand(salesIds)]
    );

    // Insert BOM items
    const { rows: bomItems } = await db.query(
      `SELECT pi.product_id, pi.quantity, p.selling_price
       FROM package_items pi JOIN products p ON p.id=pi.product_id
       WHERE pi.package_id=$1`, [pkg.id]
    );
    for (const item of bomItems) {
      const lineTotal = +(item.quantity * parseFloat(item.selling_price)).toFixed(2);
      await db.query(
        'INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5)',
        [q.id, item.product_id, item.quantity, item.selling_price, lineTotal]
      );
    }

    if (isConverted) {
      convertedQuots.push({ quotId: q.id, customerId, total, capacity, sysType });
    }
  }
  console.log(`Quotations done. Converted: ${convertedQuots.length}`);

  // ── 6. Insert orders ──────────────────────────────────────
  console.log('Adding orders...');
  const orderData = []; // { orderId, customerId, total, capacity }
  const ORDER_STATUSES = ['CONFIRMED','IN_PRODUCTION','READY_FOR_DISPATCH','DISPATCHED','DELIVERED','INSTALLATION_SCHEDULED','INSTALLED','COMPLETED'];
  for (const { quotId, customerId, total, capacity, sysType } of convertedQuots) {
    const status     = rand(ORDER_STATUSES);
    const paidRatio  = ['COMPLETED','INSTALLED','DELIVERED','DISPATCHED'].includes(status) ? 1 : 0.5;
    const amountPaid = +(total * paidRatio).toFixed(2);
    const { rows: [o] } = await db.query(
      `INSERT INTO orders (quotation_id, customer_id, total_amount, amount_paid, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [quotId, customerId, total, amountPaid, status, rand(salesIds)]
    );
    orderData.push({ orderId: o.id, customerId, total, amountPaid, status, capacity });
  }
  console.log(`Orders done: ${orderData.length}`);

  // ── 7. Payments ───────────────────────────────────────────
  console.log('Adding payments...');
  let payCounter = payBase + 1;
  for (const { orderId, total, amountPaid } of orderData) {
    if (amountPaid <= 0) continue;
    if (amountPaid >= total) {
      // Two payments: advance + final
      const half = +(total / 2).toFixed(2);
      const ref1 = `PAY-TD-${String(payCounter++).padStart(5,'0')}`;
      const ref2 = `PAY-TD-${String(payCounter++).padStart(5,'0')}`;
      const m1 = randInt(8,9); const m2 = m1 + 1;
      await db.query(
        'INSERT INTO payments (order_id, amount, payment_type, payment_reference, payment_date, recorded_by) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, half, 'ADVANCE', ref1, `2026-${String(m1).padStart(2,'0')}-${String(randInt(1,20)).padStart(2,'0')}`, rand(salesIds)]
      );
      await db.query(
        'INSERT INTO payments (order_id, amount, payment_type, payment_reference, payment_date, recorded_by) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, total - half, 'FINAL', ref2, `2026-${String(m2).padStart(2,'0')}-${String(randInt(1,20)).padStart(2,'0')}`, rand(salesIds)]
      );
    } else {
      // Advance only
      const ref = `PAY-TD-${String(payCounter++).padStart(5,'0')}`;
      await db.query(
        'INSERT INTO payments (order_id, amount, payment_type, payment_reference, payment_date, recorded_by) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, amountPaid, 'ADVANCE', ref, `2026-${String(randInt(8,10)).padStart(2,'0')}-${String(randInt(1,25)).padStart(2,'0')}`, rand(salesIds)]
      );
    }
  }
  console.log('Payments done');

  // ── 8. Serial numbers + dispatches ────────────────────────
  console.log('Adding serial numbers and dispatches...');
  const dispatchableOrders = orderData.filter(o =>
    ['DISPATCHED','DELIVERED','INSTALLATION_SCHEDULED','INSTALLED','COMPLETED'].includes(o.status)
  );

  let snCounter  = snBase + 1;
  const SNS_FOR_WARRANTY = [];

  for (const { orderId, status, capacity } of dispatchableOrders) {
    const panelCount = capacity === 3 ? 6 : capacity === 5 ? 10 : 19;
    const dispStatus = ['DELIVERED','INSTALLATION_SCHEDULED','INSTALLED','COMPLETED'].includes(status) ? 'DELIVERED' : 'IN_TRANSIT';
    const dispMonth  = randInt(9, 10);
    const dispDay    = randInt(1, 25);
    const dispDate   = `2026-${String(dispMonth).padStart(2,'0')}-${String(dispDay).padStart(2,'0')}`;

    // Insert serial numbers
    const panelIds = [];
    for (let p = 0; p < panelCount; p++) {
      const sn = `WAR-TD-${String(snCounter++).padStart(5,'0')}`;
      const { rows: [r] } = await db.query(
        `INSERT INTO serial_numbers (product_id, serial_number, order_id, dispatch_date, status)
         VALUES (1,$1,$2,$3,'DISPATCHED') RETURNING id`,
        [sn, orderId, dispDate]
      );
      panelIds.push(r.id);
    }

    // Inverter serial
    const invProdId = capacity >= 10 ? 4 : 3;
    const invSN = `INV-TD-${String(snCounter++).padStart(5,'0')}`;
    const { rows: [invRow] } = await db.query(
      `INSERT INTO serial_numbers (product_id, serial_number, order_id, dispatch_date, status)
       VALUES ($1,$2,$3,$4,'DISPATCHED') RETURNING id`,
      [invProdId, invSN, orderId, dispDate]
    );

    const allSnIds = [...panelIds, invRow.id];

    // Dispatch record
    const { rows: [d] } = await db.query(
      `INSERT INTO dispatches (order_id, dispatched_at, status, dispatched_by)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [orderId, `${dispDate} 10:00:00+05:30`, dispStatus, rand([4, ...(salesIds)])]
    );

    // Dispatch items
    for (const snId of allSnIds) {
      await db.query('INSERT INTO dispatch_items (dispatch_id, serial_number_id) VALUES ($1,$2)', [d.id, snId]);
    }

    // Collect for warranties
    SNS_FOR_WARRANTY.push({ snIds: panelIds, invSnId: invRow.id, startDate: dispDate });
  }
  console.log(`Serial numbers and dispatches done`);

  // ── 9. Warranties ─────────────────────────────────────────
  console.log('Adding warranties...');
  for (const { snIds, invSnId, startDate } of SNS_FOR_WARRANTY) {
    const start = new Date(startDate);
    const panelExpiry = new Date(start); panelExpiry.setFullYear(start.getFullYear() + 20);
    const invExpiry   = new Date(start); invExpiry.setFullYear(start.getFullYear() + 2);
    for (const snId of snIds) {
      await db.query(
        `INSERT INTO warranties (serial_number_id, start_date, expiry_date, warranty_status) VALUES ($1,$2,$3,'ACTIVE')`,
        [snId, startDate, panelExpiry.toISOString().split('T')[0]]
      );
    }
    await db.query(
      `INSERT INTO warranties (serial_number_id, start_date, expiry_date, warranty_status) VALUES ($1,$2,$3,'ACTIVE')`,
      [invSnId, startDate, invExpiry.toISOString().split('T')[0]]
    );
  }
  console.log('Warranties done');

  // ── 10. Installations ─────────────────────────────────────
  console.log('Adding installations...');
  const installableOrders = orderData.filter(o =>
    ['INSTALLATION_SCHEDULED','INSTALLED','COMPLETED'].includes(o.status)
  );
  for (const { orderId, status } of installableOrders) {
    const techId  = rand(techIds);
    const isDone  = ['INSTALLED','COMPLETED'].includes(status);
    const m = randInt(10, 11);
    const d = randInt(1, 25);
    const schedDate = `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    await db.query(
      `INSERT INTO installations (order_id, technician_id, scheduled_date, start_time, completion_time, system_capacity, installation_status, test_result, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        orderId, techId, schedDate,
        isDone ? `${schedDate} 08:30:00+05:30` : null,
        isDone ? `${schedDate} 17:00:00+05:30` : null,
        rand([3.00, 5.00, 10.00]),
        isDone ? 'COMPLETED' : 'SCHEDULED',
        isDone ? 'PASS' : null,
        isDone ? 'System commissioned. Grid export confirmed.' : 'Crew assigned, awaiting dispatch.',
      ]
    );
  }
  console.log('Installations done');

  // ── 11. Service tickets (30) ──────────────────────────────
  console.log('Adding service tickets...');
  const ticketStatuses = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
  const allCustIds = newCustomerIds.concat(
    (await db.query('SELECT id FROM customers WHERE id <= $1', [custBase])).rows.map(r => r.id)
  );
  for (let i = 0; i < 30; i++) {
    const custId    = rand(allCustIds);
    const covered   = Math.random() > 0.4;
    const status    = rand(ticketStatuses);
    const desc      = rand(TICKET_DESCS);
    const faultCode = rand(FAULT_CODES);
    await db.query(
      `INSERT INTO service_tickets (customer_id, technician_id, fault_code, description, warranty_covered, parts_cost, labour_cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [custId, rand(techIds), faultCode, desc, covered, covered ? 0 : 500, covered ? 0 : 1000, status]
    );
  }
  console.log('Service tickets done');

  // ── 12. Expenses ──────────────────────────────────────────
  console.log('Adding expenses...');
  for (const { orderId } of orderData) {
    const numExpenses = randInt(1, 3);
    for (let e = 0; e < numExpenses; e++) {
      const cat  = rand(EXPENSE_CATS);
      const desc = rand(EXPENSE_DESCS[cat]);
      const amt  = randInt(1500, 15000);
      const m    = randInt(9, 11);
      const day  = randInt(1, 25);
      await db.query(
        `INSERT INTO expenses (order_id, category, amount, description, expense_date, recorded_by)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, cat, amt, desc, `2026-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`, rand(salesIds)]
      );
    }
  }
  console.log('Expenses done');

  // ── Done ──────────────────────────────────────────────────
  const { rows } = await db.query(`
    SELECT 'customers' AS tbl, COUNT(*) FROM customers
    UNION ALL SELECT 'leads', COUNT(*) FROM leads
    UNION ALL SELECT 'surveys', COUNT(*) FROM surveys
    UNION ALL SELECT 'quotations', COUNT(*) FROM quotations
    UNION ALL SELECT 'orders', COUNT(*) FROM orders
    UNION ALL SELECT 'payments', COUNT(*) FROM payments
    UNION ALL SELECT 'serial_numbers', COUNT(*) FROM serial_numbers
    UNION ALL SELECT 'dispatches', COUNT(*) FROM dispatches
    UNION ALL SELECT 'warranties', COUNT(*) FROM warranties
    UNION ALL SELECT 'installations', COUNT(*) FROM installations
    UNION ALL SELECT 'service_tickets', COUNT(*) FROM service_tickets
    UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
  `);
  console.log('\n=== Final Row Counts ===');
  rows.forEach(r => console.log(`  ${r.tbl.padEnd(20)} ${r.count}`));

  process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
