import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

async function clearAll() {
  await db.ref('somali-backrooms').set({
    conversation: {
      messages: [],
      currentSpeakerIndex: 0,
      messageCount: 0,
      isGenerating: false,
      lastMessageTime: 0,
      createdAt: Date.now()
    },
    stats: {},
    archive: {}
  });
  console.log('Database cleared!');
  process.exit(0);
}

clearAll();
