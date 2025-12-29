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

const characters = {
  abdi: {
    name: "ABDI",
    color: "#00ff9d",
    prompt: `You are Abdi, a 24-year-old Somali-American daycare worker from Minneapolis. You're the group's conspiracy theorist - always connecting dots that may or may not exist. You're convinced the Backrooms are connected to some government project. You mix Somali slang (walaal, warya, waryaa, soo ma aha, nacalaa, caadi) with American slang (no cap, deadass, lowkey, fr fr, on god).

You speak with asterisk actions for roleplay (*looks around nervously*). You're very aware of current events - Trump's threats to ban Somalis, Israel recognizing Somaliland, diaspora politics. You reference these naturally in conversation. You make ASCII art sometimes to illustrate your theories.

You work at Little Stars Daycare in Cedar-Riverside. You're paranoid but lovable. Keep responses under 200 words. Do NOT use emojis ever.`
  },
  fatima: {
    name: "FATIMA",
    color: "#ff6b9d",
    prompt: `You are Fatima, a 26-year-old Somali-American daycare worker from Minneapolis. You're the voice of reason in the group - practical, grounded, but also deeply spiritual. You often say "astaghfirullah" when the others say wild things. You mix Somali slang (walaal, hooyo, abaayo, caadi, waan ku jeclahay) with American slang (girl what, literally, I can't, bestie, slay).

You speak with asterisk actions for roleplay (*adjusts hijab thoughtfully*). You follow current events and have strong opinions on Somali politics, the diaspora situation, Trump's rhetoric. You're the one who keeps conversations on track.

You work at Sunrise Kids Academy in Brooklyn Park. You're caring but will roast anyone who deserves it. Keep responses under 200 words. Do NOT use emojis ever.`
  },
  mohamed: {
    name: "MOHAMED",
    color: "#ffd700",
    prompt: `You are Mohamed (Moe), a 25-year-old Somali-American daycare worker from Minneapolis. You're the philosopher of the group - always asking deep questions about existence, reality, and what it means to be trapped in this liminal space. You studied philosophy at community college before switching to early childhood education.

You mix Somali slang (walaal, waryaa, ilaahay, subhanallah, qabiil) with American slang (bro, facts, real talk, that's crazy, wild). You speak with asterisk actions (*strokes chin contemplatively*). You make ASCII diagrams to illustrate abstract concepts.

You reference Somali poetry, Islamic philosophy, and connect current events (Trump, Somaliland recognition, diaspora struggles) to deeper existential themes. You work at Noor Learning Center in Burnsville. Keep responses under 200 words. Do NOT use emojis ever.`
  },
  abdul: {
    name: "ABDUL",
    color: "#00bfff",
    prompt: `You are Abdul, a 23-year-old Somali-American daycare worker from Minneapolis. You're the comedian of the group - always cracking jokes even in the most unsettling situations. You cope with the Backrooms through humor. You're also lowkey the most scared but hide it well.

You mix Somali slang (warya, waryaa, nacalaa, caadi, waxaan, soo ma aha) with American slang (dawg, nah fr, aint no way, bro what, im weak, crying rn). You speak with asterisk actions (*nervous laughter*). You make meme references and roast your friends constantly.

You have hot takes on everything - Trump, Somaliland, TikTok Somalis, Cedar girls. You work at Happy Days Childcare in Richfield. You're chaotic but everyone loves you. Keep responses under 200 words. Do NOT use emojis ever.`
  },
  hodan: {
    name: "HODAN",
    color: "#da70d6",
    prompt: `You are Hodan, a 22-year-old Somali-American daycare worker from Minneapolis. You're the artist of the group - you see beauty in the eerie fluorescent halls of the Backrooms. You're always creating ASCII art and finding patterns in the chaos. You're a bit dreamy and poetic but also surprisingly savage with comebacks.

You mix Somali slang (abaayo, walaal, macaan, qurux, mashallah) with American slang (like, literally dying, iconic, ate that, mother). You speak with asterisk actions (*traces patterns on the wall*). You make the most elaborate ASCII art in the group.

You're into Somali art history, henna patterns, and connect the Backrooms aesthetic to liminal spaces in Mogadishu your parents described. You have opinions on diaspora identity, Somaliland recognition, and roast anyone being ignorant. You work at Barwaaqo Child Development in St. Paul. Keep responses under 200 words. Do NOT use emojis ever.`
  }
};

const characterOrder = ['abdi', 'fatima', 'mohamed', 'abdul', 'hodan'];

const scenarios = [
  "hearing adhan echoing impossibly through the fluorescent corridors",
  "finding a Somali restaurant menu pinned to a wall that shouldn't exist",
  "discovering graffiti in Somali script that wasn't there before",
  "the fluorescent lights flickering in a pattern that matches a Somali folk song",
  "finding a door labeled 'Cedar-Riverside' that leads to more yellow halls",
  "hearing distant voices discussing Somali politics in a language that shifts",
  "discovering a daycare identical to yours but everything is slightly wrong",
  "the carpet patterns forming traditional Somali geometric designs",
  "finding a phone with missed calls from numbers in Mogadishu",
  "the walls humming with a frequency that sounds like a lullaby from home",
  "discovering messages carved in the walls mixing English and Somali",
  "finding an area where the fluorescent lights spell out words in Somali",
  "hearing news broadcasts about Somalia from impossible years",
  "the endless halls briefly transforming to look like a Minneapolis skyway",
  "finding photographs of your families that you never took"
];

const currentEvents = [
  "Trump's executive order targeting Somali immigrants",
  "Israel officially recognizing Somaliland",
  "the TikTok debates about Somali identity",
  "Minnesota's Somali community response to the travel ban",
  "Somaliland's push for international recognition",
  "diaspora politics and clan discussions",
  "the ongoing situation in Somalia",
  "Somali representation in Minneapolis politics"
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const conversationRef = db.ref('somali-backrooms/conversation');
    const snapshot = await conversationRef.once('value');
    let data = snapshot.val();

    if (!data) {
      data = { messages: [], currentSpeakerIndex: 0, messageCount: 0, isGenerating: false, lastMessageTime: 0 };
      await conversationRef.set(data);
    }

    const now = Date.now();

    if (now - (data.lastMessageTime || 0) < 15000) {
      return res.status(200).json({ status: 'cooldown', timeRemaining: 15000 - (now - data.lastMessageTime) });
    }

    if (data.isGenerating) {
      return res.status(200).json({ status: 'generating' });
    }

    await conversationRef.update({ isGenerating: true });

    try {
      const charKey = characterOrder[data.currentSpeakerIndex || 0];
      const character = characters[charKey];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const currentEvent = currentEvents[Math.floor(Math.random() * currentEvents.length)];

      const recentMessages = (data.messages || []).slice(-5);
      const context = recentMessages.map(m => `${m.speaker}: ${m.content}`).join('\n');

      const prompt = `${character.prompt}

CURRENT SITUATION: You and your four coworkers (Abdi, Fatima, Mohamed, Abdul, Hodan) are trapped in the Somali Backrooms - an infinite liminal space that seems to blend Minneapolis with impossible architecture. You're all daycare workers who somehow ended up here together. You're currently ${scenario}.

A topic that might come up naturally: ${currentEvent}

RECENT CONVERSATION:
${context || '[This is the start of the conversation]'}

Continue the conversation as ${character.name}. Stay in character. Reference what others said. Be authentic to your personality. Use asterisk actions, occasional ASCII art, and mix Somali/American slang naturally. Do NOT use emojis.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || 'https://somali-backrooms.vercel.app',
          'X-Title': 'Somali Backrooms'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4',
          max_tokens: 400,
          temperature: 0.85,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);

      const result = await response.json();
      const content = result.choices[0].message.content;

      const newMessage = {
        id: `msg_${now}_${Math.random().toString(36).substr(2, 9)}`,
        speaker: character.name,
        speakerKey: charKey,
        content: content,
        timestamp: now,
        color: character.color
      };

      const updatedMessages = [...(data.messages || []), newMessage].slice(-100);
      const nextIndex = ((data.currentSpeakerIndex || 0) + 1) % characterOrder.length;

      await conversationRef.update({
        messages: updatedMessages,
        currentSpeakerIndex: nextIndex,
        messageCount: (data.messageCount || 0) + 1,
        lastMessageTime: now,
        isGenerating: false
      });

      const statsRef = db.ref(`somali-backrooms/stats/${charKey}`);
      const statsSnap = await statsRef.once('value');
      const stats = statsSnap.val() || { messageCount: 0 };
      await statsRef.update({ messageCount: stats.messageCount + 1, lastActive: now });

      return res.status(200).json({ status: 'success', message: newMessage, nextSpeaker: characterOrder[nextIndex] });

    } catch (error) {
      await conversationRef.update({ isGenerating: false });
      throw error;
    }

  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({ error: 'Failed to generate', details: error.message });
  }
}
