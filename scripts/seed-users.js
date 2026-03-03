/**
 * Script to seed dummy users to the database via signup API
 * Run with: node scripts/seed-users.js
 */

const API_BASE_URL = 'https://match-backend-jz3n.onrender.com';

// Rwanda geographic bounds
const RWANDA_BOUNDS = {
  latitude: { min: -2.84, max: -1.05 },
  longitude: { min: 28.86, max: 30.90 }
};

// Common Rwandan names
const maleNames = [
  'Uwimana', 'Niyonzima', 'Hakizimana', 'Nsabimana', 'Mugisha',
  'Nshimiyimana', 'Shema', 'Habimana', 'Ndayisenga', 'Kalisa',
  'Nkundwa', 'Hategeka', 'Manzi', 'Niyonshuti', 'Bizimana'
];

const femaleNames = [
  'Uwase', 'Umulisa', 'Ishimwe', 'Uwineza', 'Mutesi',
  'Umutoni', 'Murekatete', 'Nirere', 'Ingabire', 'Mukamana',
  'Uwera', 'Iradukunda', 'Dusabimana', 'Nyiramana', 'Mukandayisenga'
];

// Rwandan districts
const locations = [
  { district: 'Kicukiro', sector: 'Gatenga', cell: 'Kagarama', village: 'Nyarugunga' },
  { district: 'Gasabo', sector: 'Remera', cell: 'Rukiri', village: 'Kimihurura' },
  { district: 'Nyarugenge', sector: 'Nyarugenge', cell: 'Rwezamenyo', village: 'Nyamirambo' },
  { district: 'Rwamagana', sector: 'Karenge', cell: 'Gahengeri', village: 'Nyakariro' },
  { district: 'Kayonza', sector: 'Kabare', cell: 'Kahi', village: 'Mukarange' },
  { district: 'Ngoma', sector: 'Sake', cell: 'Rukira', village: 'Kibungo' },
  { district: 'Bugesera', sector: 'Juru', cell: 'Mwendo', village: 'Nyamata' },
  { district: 'Muhanga', sector: 'Muhanga', cell: 'Cyeza', village: 'Gitarama' },
  { district: 'Kamonyi', sector: 'Gacurabwenge', cell: 'Ruhango', village: 'Nyamabuye' },
  { district: 'Ruhango', sector: 'Kinazi', cell: 'Cyahinda', village: 'Byimana' },
  { district: 'Nyanza', sector: 'Busasamana', cell: 'Kibirizi', village: 'Nyanza' },
  { district: 'Huye', sector: 'Tumba', cell: 'Matyazo', village: 'Butare' },
  { district: 'Nyamagabe', sector: 'Gasaka', cell: 'Muganza', village: 'Gikongoro' },
  { district: 'Rusizi', sector: 'Kamembe', cell: 'Bugarama', village: 'Cyangugu' },
  { district: 'Karongi', sector: 'Bwishyura', cell: 'Rubengera', village: 'Kibuye' },
  { district: 'Rutsiro', sector: 'Boneza', cell: 'Ruhango', village: 'Murunda' },
  { district: 'Rubavu', sector: 'Gisenyi', cell: 'Umuganda', village: 'Gisenyi' },
  { district: 'Musanze', sector: 'Muhoza', cell: 'Muhoza', village: 'Ruhengeri' },
  { district: 'Gicumbi', sector: 'Byumba', cell: 'Cyumba', village: 'Byumba' },
  { district: 'Rulindo', sector: 'Shyorongi', cell: 'Masoro', village: 'Kigali' }
];

// Helper functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generatePhoneNumber() {
  // Rwanda phone format: 078/079/072/073 followed by 7 digits
  const prefix = randomChoice(['078', '079', '072', '073']);
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

function generateEmail(name) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${normalized}${random}@${randomChoice(domains)}`;
}

function generateUser(index) {
  const sex = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
  const name = sex === 'MALE' ? randomChoice(maleNames) : randomChoice(femaleNames);
  const location = randomChoice(locations);
  
  return {
    name: name,
    sex: sex,
    password: 'Test1234!', // Simple password for testing
    phone_number: generatePhoneNumber(),
    email: generateEmail(name),
    district: location.district,
    sector: location.sector,
    village: location.village,
    cell: location.cell,
    latitude: randomFloat(RWANDA_BOUNDS.latitude.min, RWANDA_BOUNDS.latitude.max),
    longitude: randomFloat(RWANDA_BOUNDS.longitude.min, RWANDA_BOUNDS.longitude.max),
    lastActive: new Date().toISOString()
  };
}

async function signupUser(userData, index) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ User ${index + 1} created: ${userData.name} (${userData.phone_number}) in ${userData.district}`);
      return { success: true, user: userData };
    } else {
      console.error(`❌ User ${index + 1} failed: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error(`❌ User ${index + 1} error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function seedUsers() {
  console.log('🌱 Starting to seed users...\n');
  console.log(`API: ${API_BASE_URL}/auth/signup\n`);
  
  const results = {
    success: 0,
    failed: 0,
    total: 20
  };

  for (let i = 0; i < 20; i++) {
    const userData = generateUser(i);
    const result = await signupUser(userData, i);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Seeding Results:');
  console.log(`   Total: ${results.total}`);
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log('='.repeat(50));
}

// Run the script
seedUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
