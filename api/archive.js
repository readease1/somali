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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;

    if (id) {
      const snapshot = await db.ref(`somali-backrooms/archive/${id}`).once('value');
      const data = snapshot.val();
      if (!data) return res.status(404).json({ error: 'Archive not found' });
      return res.status(200).json(data);
    }

    const snapshot = await db.ref('somali-backrooms/archive').orderByChild('archivedAt').limitToLast(50).once('value');
    const data = snapshot.val();

    if (!data) return res.status(200).json({ archives: [] });

    const archives = Object.entries(data).map(([id, archive]) => ({
      id,
      messageCount: archive.messageCount || archive.messages?.length || 0,
      archivedAt: archive.archivedAt,
      startTime: archive.startTime,
      endTime: archive.endTime,
      preview: archive.messages?.[0]?.content?.substring(0, 100) || 'No preview'
    })).sort((a, b) => b.archivedAt - a.archivedAt);

    return res.status(200).json({ archives });

  } catch (error) {
    console.error('Archive error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
