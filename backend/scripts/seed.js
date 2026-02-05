const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

faker.seed(12345);

const roles = ['Frontend Dev', 'Product Manager', 'Designer'];
const departments = {
  'Frontend Dev': 'Engineering',
  'Product Manager': 'Product',
  'Designer': 'Design'
};
const statuses = ['Active', 'On Leave', 'Terminated'];

const salaryBands = {
  'Frontend Dev': { min: 90000, max: 170000 },
  'Product Manager': { min: 110000, max: 190000 },
  'Designer': { min: 80000, max: 150000 }
};

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Document.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create organization
    const org = await Organization.create({
      name: 'StaffDeck Inc',
      domain: 'staffdeck.io',
      timezone: 'Asia/Kolkata',
      settings: {
        payFrequency: 'MONTHLY',
        nextPayrollDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      }
    });
    console.log('✅ Created organization');

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@staffdeck.io',
      password: 'admin123',
      role: 'ADMIN',
      organizationId: org._id
    });
    console.log('✅ Created admin user');

    // Create admin employee
    const adminEmployee = await Employee.create({
      organizationId: org._id,
      userId: adminUser._id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@staffdeck.io',
      role: 'Product Manager',
      department: 'Product',
      status: 'Active',
      salary: 150000,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      avatar: `https://i.pravatar.cc/96?img=1`
    });

    adminUser.employeeId = adminEmployee._id;
    await adminUser.save();

    // Generate 49 more employees
    const employees = [];
    for (let i = 0; i < 49; i++) {
      const role = faker.helpers.arrayElement(
        i < 22 ? ['Frontend Dev'] :
        i < 37 ? ['Frontend Dev', 'Product Manager'] :
        roles
      );
      
      let status = 'Active';
      if (i >= 39) status = 'On Leave';
      if (i >= 45) status = 'Terminated';
      
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = i < 3 
        ? `${firstName} ${lastName}-${faker.person.lastName()}`
        : `${firstName} ${lastName}`;
      
      const [first, ...rest] = name.split(' ');
      const last = rest.join(' ');
      
      const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@staffdeck.io`;
      
      const salary = faker.number.int({
        min: salaryBands[role].min,
        max: salaryBands[role].max
      });
      
      const joinDate = i < 5
        ? faker.date.recent({ days: 60 })
        : faker.date.past({ years: 5 });
      
      employees.push({
        organizationId: org._id,
        firstName: first,
        lastName: last,
        email,
        role,
        department: departments[role],
        status,
        salary,
        joinDate,
        avatar: `https://i.pravatar.cc/96?img=${(i % 70) + 2}`
      });
    }

    await Employee.insertMany(employees);
    console.log('✅ Created 50 employees');

    // Create some company documents
    const docs = [
      {
        organizationId: org._id,
        type: 'Policy',
        name: 'Company Handbook 2026',
        url: 'https://example.com/handbook.pdf',
        size: 2457600,
        mimeType: 'application/pdf',
        uploadedBy: adminUser._id
      },
      {
        organizationId: org._id,
        type: 'Template',
        name: 'NDA Template',
        url: 'https://example.com/nda.pdf',
        size: 156000,
        mimeType: 'application/pdf',
        uploadedBy: adminUser._id
      },
      {
        organizationId: org._id,
        type: 'Policy',
        name: 'Remote Work Policy',
        url: 'https://example.com/remote.pdf',
        size: 890000,
        mimeType: 'application/pdf',
        uploadedBy: adminUser._id,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ];

    await Document.insertMany(docs);
    console.log('✅ Created documents');

    // Create initial audit log
    await AuditLog.create({
      organizationId: org._id,
      action: 'Database seeded',
      actor: 'System',
      actorId: adminUser._id,
      target: 'Database',
      details: 'Initial database setup with 50 employees, 3 documents'
    });

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('   Email: admin@staffdeck.io');
    console.log('   Password: admin123');
    console.log('\n🌐 Access the app at: http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
