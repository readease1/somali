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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const conversationRef = db.ref('somali-backrooms/conversation');

    if (req.method === 'GET') {
      const snapshot = await conversationRef.once('value');
      const data = snapshot.val();

      if (!data) {
        const initial = { messages: [], currentSpeakerIndex: 0, messageCount: 0, isGenerating: false, lastMessageTime: 0, createdAt: Date.now() };
        await conversationRef.set(initial);
        return res.status(200).json(initial);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const snapshot = await conversationRef.once('value');
      const current = snapshot.val();

      if (current?.messages?.length > 0) {
        await db.ref('somali-backrooms/archive').push({
          messages: current.messages,
          messageCount: current.messageCount,
          archivedAt: Date.now(),
          startTime: current.messages[0]?.timestamp,
          endTime: current.messages[current.messages.length - 1]?.timestamp
        });
      }

      const fresh = { messages: [], currentSpeakerIndex: 0, messageCount: 0, isGenerating: false, lastMessageTime: 0, createdAt: Date.now() };
      await conversationRef.set(fresh);

      return res.status(200).json({ status: 'cleared', archived: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Conversation error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
