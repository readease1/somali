import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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

    return res.status(200).json({ status: 'cleared', timestamp: Date.now() });
  } catch (error) {
    console.error('Clear error:', error);
    return res.status(500).json({ error: error.message });
  }
}
