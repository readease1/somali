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

function generateMemeStats(char, count) {
  const stats = {
    abdi: {
      conspiracyLevel: Math.min(100, 45 + (count * 2.3)).toFixed(1) + '%',
      governmentWatchlist: count > 10 ? 'Definitely' : 'Probably',
      tinfoilHatStatus: count > 20 ? 'Double Layered' : 'Standard Issue',
      trustMeter: (100 - Math.min(95, count * 1.5)).toFixed(1) + '%'
    },
    fatima: {
      astaghfirullahCount: Math.floor(count * 1.7),
      patienceLevel: Math.max(5, 100 - (count * 0.8)).toFixed(1) + '%',
      roastPotential: Math.min(100, 30 + (count * 2.1)).toFixed(1) + '%',
      hooyoEnergy: 'Maximum'
    },
    mohamed: {
      existentialDread: Math.min(100, 40 + (count * 1.9)).toFixed(1) + '%',
      philosophyMode: count > 15 ? 'Transcendent' : 'Contemplative',
      deepThoughts: Math.floor(count * 0.8),
      meaningFound: 'Still Searching'
    },
    abdul: {
      copeLevel: Math.min(100, 60 + (count * 1.2)).toFixed(1) + '%',
      jokesMade: Math.floor(count * 2.1),
      actuallyScared: count > 10 ? 'Terrified' : 'Nervous',
      vibeCheck: count > 20 ? 'Immaculate' : 'Questionable'
    },
    hodan: {
      artisticVision: Math.min(100, 50 + (count * 1.8)).toFixed(1) + '%',
      asciiArtCreated: Math.floor(count * 0.4),
      aestheticLevel: count > 15 ? 'Transcendent' : 'Elevated',
      savageryIndex: Math.min(100, 25 + (count * 2.5)).toFixed(1) + '%'
    }
  };
  return stats[char] || {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const snapshot = await db.ref('somali-backrooms/stats').once('value');
    const raw = snapshot.val() || {};

    const stats = {};
    for (const char of ['abdi', 'fatima', 'mohamed', 'abdul', 'hodan']) {
      const s = raw[char] || { messageCount: 0, lastActive: null };
      stats[char] = {
        messageCount: s.messageCount || 0,
        lastActive: s.lastActive || null,
        memeStats: generateMemeStats(char, s.messageCount || 0)
      };
    }

    return res.status(200).json({ stats });

  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
