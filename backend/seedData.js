const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Asset = require('./models/Asset');
const Issue = require('./models/Issue');
const AssetHistory = require('./models/AssetHistory');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fixflow');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data for clean demo state
    await User.deleteMany();
    await Asset.deleteMany();
    await Issue.deleteMany();
    await AssetHistory.deleteMany();

    // 1. Create Users
    const admin = await User.create({
      name: 'Sarah Admin',
      email: 'admin@fixflow.io',
      password: 'Password123!',
      role: 'admin',
      phone: '+1 (555) 019-2831',
      specialization: 'Operations Director',
    });

    const tech1 = await User.create({
      name: 'Alex Rivera',
      email: 'tech@fixflow.io',
      password: 'Password123!',
      role: 'technician',
      phone: '+1 (555) 014-9982',
      specialization: 'HVAC & Electrical Master',
    });

    const tech2 = await User.create({
      name: 'Marcus Chen',
      email: 'marcus@fixflow.io',
      password: 'Password123!',
      role: 'technician',
      phone: '+1 (555) 018-7712',
      specialization: 'Audio/Visual & IT Hardware',
    });

    console.log('Users created: Admin, Tech 1, Tech 2');

    // 2. Create Assets
    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';

    const assetsData = [
      {
        name: 'Classroom Projector 01',
        assetCode: 'AST-1001',
        category: 'Audio/Visual',
        location: { building: 'Academic Block A', floor: '3rd Floor', room: 'Lecture Hall 302' },
        condition: 'Good',
        status: 'Operational',
        modelNumber: 'Epson PowerLite 2250U',
        serialNumber: 'EP-99482-TX',
        assignedTechnician: tech2._id,
        purchaseDate: new Date('2024-01-15'),
        lastServiceDate: new Date('2026-08-10'),
        nextServiceDate: new Date('2026-11-10'),
        qrCodeUrl: `${clientBase}/scan/AST-1001`,
        createdBy: admin._id,
      },
      {
        name: 'Server Room HVAC Unit 02',
        assetCode: 'AST-1002',
        category: 'HVAC',
        location: { building: 'Tech Center', floor: 'Basement', room: 'Server Room B-01' },
        condition: 'Fair',
        status: 'Operational',
        modelNumber: 'Daikin SkyAir Inverter 48k',
        serialNumber: 'DK-2024-0988',
        assignedTechnician: tech1._id,
        purchaseDate: new Date('2023-05-20'),
        lastServiceDate: new Date('2026-09-01'),
        nextServiceDate: new Date('2026-12-01'),
        qrCodeUrl: `${clientBase}/scan/AST-1002`,
        createdBy: admin._id,
      },
      {
        name: 'Chemistry Lab Fume Hood Fan',
        assetCode: 'AST-1003',
        category: 'Machinery',
        location: { building: 'Science Complex', floor: '1st Floor', room: 'Lab 104' },
        condition: 'Good',
        status: 'Operational',
        modelNumber: 'Labconco Protector Premier',
        serialNumber: 'LB-7731-FH',
        assignedTechnician: tech1._id,
        purchaseDate: new Date('2023-11-10'),
        lastServiceDate: new Date('2026-07-22'),
        nextServiceDate: new Date('2026-10-22'),
        qrCodeUrl: `${clientBase}/scan/AST-1003`,
        createdBy: admin._id,
      },
      {
        name: 'Library Workstation PC 08',
        assetCode: 'AST-1004',
        category: 'Computing',
        location: { building: 'Central Library', floor: '2nd Floor', room: 'Computer Pod 4' },
        condition: 'Excellent',
        status: 'Operational',
        modelNumber: 'Dell OptiPlex 7010 Micro',
        serialNumber: 'DL-8834921-X',
        assignedTechnician: tech2._id,
        purchaseDate: new Date('2024-03-01'),
        lastServiceDate: new Date('2026-06-15'),
        nextServiceDate: new Date('2026-12-15'),
        qrCodeUrl: `${clientBase}/scan/AST-1004`,
        createdBy: admin._id,
      },
      {
        name: 'Cafeteria Commercial Espresso Machine',
        assetCode: 'AST-1005',
        category: 'Electronics',
        location: { building: 'Student Union', floor: 'Ground Floor', room: 'Main Dining' },
        condition: 'Good',
        status: 'Operational',
        modelNumber: 'La Marzocco Linea PB 2G',
        serialNumber: 'LM-2022-8819',
        assignedTechnician: tech1._id,
        purchaseDate: new Date('2022-09-14'),
        lastServiceDate: new Date('2026-08-30'),
        nextServiceDate: new Date('2026-11-30'),
        qrCodeUrl: `${clientBase}/scan/AST-1005`,
        createdBy: admin._id,
      },
    ];

    const insertedAssets = await Asset.insertMany(assetsData);
    console.log(`Created ${insertedAssets.length} demo assets`);

    // 3. Create initial History records for each asset
    for (const a of insertedAssets) {
      await AssetHistory.create({
        asset: a._id,
        action: 'Asset Registered',
        actor: { name: 'Sarah Admin', role: 'admin', userId: admin._id },
        details: `Initial registration of ${a.name} [${a.assetCode}] in FixFlow system`,
        newStatus: 'Operational',
      });
    }

    // 4. Create one initial issue on Projector to showcase demo flow
    const sampleIssue = await Issue.create({
      issueNumber: 'ISS-1001',
      asset: insertedAssets[0]._id,
      title: 'HDMI Signal Drop and Display Flickering',
      description: 'The projector display flickers intermittently and often fails to detect HDMI input during classroom lectures.',
      category: 'Audio/Visual',
      priority: 'High',
      status: 'Reported',
      reporter: {
        name: 'Prof. Jonathan Davis',
        email: 'jdavis@university.edu',
        phone: '+1 (555) 918-2231',
        isPublic: true,
      },
      aiTriage: {
        suggestedTitle: 'HDMI Signal Drop and Display Flickering',
        suggestedCategory: 'Audio/Visual',
        suggestedPriority: 'High',
        possibleCauses: ['Faulty HDMI cable or loose wall plate connector', 'Overheating video scaler board'],
        initialChecks: ['Reseat HDMI cable at projector and lecturer desk', 'Test alternate video input source'],
        recurringWarning: '',
        wasAiUsed: true,
        wasUserEdited: false,
      },
    });

    // Update Projector status to 'Issue Reported'
    insertedAssets[0].status = 'Issue Reported';
    await insertedAssets[0].save();

    await AssetHistory.create({
      asset: insertedAssets[0]._id,
      issue: sampleIssue._id,
      action: 'Issue Reported',
      actor: { name: 'Prof. Jonathan Davis', role: 'Reporter' },
      details: 'Reported issue [ISS-1001]: HDMI Signal Drop and Display Flickering',
      previousStatus: 'Operational',
      newStatus: 'Issue Reported',
    });

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
