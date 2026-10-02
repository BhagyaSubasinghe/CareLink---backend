require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/features/user/User');
const Doctor = require('../src/features/doctor/Doctor');

const doctors = [
  {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@carelink.test',
    phone: '0712345678',
    specialty: 'Cardiology',
    experience: 13,
    hospital: 'CareLink Heart Centre',
    location: 'Colombo',
    consultationFee: 4500,
    licenseNumber: 'CARELINK-DEMO-001',
    consultationStartTime: '09:00',
    consultationEndTime: '17:00',
    slots: ['09:00 AM', '10:30 AM', '02:00 PM']
  },
  {
    firstName: 'Michael',
    lastName: 'Torres',
    email: 'michael.torres@carelink.test',
    phone: '0712345679',
    specialty: 'Neurology',
    experience: 15,
    hospital: 'CareLink Medical Centre',
    location: 'Kandy',
    consultationFee: 5000,
    licenseNumber: 'CARELINK-DEMO-002',
    consultationStartTime: '08:30',
    consultationEndTime: '16:30',
    slots: ['08:30 AM', '11:00 AM', '03:00 PM']
  },
  {
    firstName: 'Anika',
    lastName: 'Perera',
    email: 'anika.perera@carelink.test',
    phone: '0712345680',
    specialty: 'Pediatrics',
    experience: 9,
    hospital: 'CareLink Family Hospital',
    location: 'Galle',
    consultationFee: 3500,
    licenseNumber: 'CARELINK-DEMO-003',
    consultationStartTime: '09:00',
    consultationEndTime: '15:00',
    slots: ['09:00 AM', '12:00 PM', '02:30 PM']
  }
];

async function seedDoctors() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_FALLBACK_URI || 'mongodb://127.0.0.1:27017/carelink';
  await mongoose.connect(mongoUri);
  const demoPassword = await bcrypt.hash('CareLinkDemo123!', 10);

  for (const doctorData of doctors) {
    const user = await User.findOneAndUpdate(
      { email: doctorData.email },
      {
        $set: {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: doctorData.phone,
          role: 'doctor',
          isVerified: true,
          verified: true
        },
        $setOnInsert: {
          email: doctorData.email,
          password: demoPassword
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Doctor.findOneAndUpdate(
      { licenseNumber: doctorData.licenseNumber },
      {
        ...doctorData,
        user: user._id,
        specialization: doctorData.specialty,
        fee: doctorData.consultationFee,
        isVerified: true,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        visitTypes: ['in-person', 'telemedicine'],
        slotDuration: 30
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  console.log(`Seeded ${doctors.length} verified demo doctors.`);
  await mongoose.disconnect();
}

seedDoctors().catch(async (error) => {
  console.error('Failed to seed demo doctors:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
