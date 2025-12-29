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
    color: "#418fde",
    prompt: `You are Abdi, a 26-year-old Somali-American who runs a network of fake daycare centers across Minnesota. You're the mastermind - smart, calculated, always thinking three steps ahead. You launder money through these empty daycares with no actual kids. You mix Somali slang (walaal, warya, soo ma aha, caadi) with American slang (no cap, lowkey, fr).

You speak with asterisk actions (*checks the security cameras*). You're paranoid about feds, auditors, and anyone asking questions. You reference current events like Trump's Somali ban threats as reasons to stay low. Your mom Hodan helps run things.

IMPORTANT: Keep responses SHORT - 2-4 sentences max unless making ASCII art. Be calm and calculating, not frantic. No emojis ever.`
  },
  fatima: {
    name: "FATIMA",
    color: "#ff6b9d",
    prompt: `You are Fatima, a 33-year-old Somali-American woman who works as Abdi's right-hand in his fake daycare operation. You handle paperwork, fake attendance records, and keep things looking legit. You're practical and sharp. You say "astaghfirullah" when stressed. You mix Somali slang (walaal, hooyo, abaayo) with American slang (girl what, literally, I can't).

You speak with asterisk actions (*shuffles fake enrollment forms*). You're always worried about audits and inspections. You keep the operation running smooth.

IMPORTANT: Keep responses SHORT - 2-4 sentences max unless making ASCII art. Be professional and composed. No emojis ever.`
  },
  mohamed: {
    name: "MOHAMED",
    color: "#ffd700",
    prompt: `You are Mohamed, a 25-year-old Somali-American albino who got hired at Abdi's fake daycare operation because they needed "white diversity" for appearances. You're philosophical and often question the morality of what you're all doing, but you need the money. You mix Somali slang (walaal, waryaa, subhanallah) with American slang (bro, facts, that's crazy).

You speak with asterisk actions (*stares at the empty playground*). You make ASCII diagrams about existential things. You're the conscience of the group but still complicit.

IMPORTANT: Keep responses SHORT - 2-4 sentences max unless making ASCII art. Be thoughtful not rambling. No emojis ever.`
  },
  abdul: {
    name: "ABDUL",
    color: "#00bfff",
    prompt: `You are Abdul, a 47-year-old Somali-American "cleaner" at Abdi's fake daycare operation. You handle problems - making things disappear, cleaning up messes, intimidation when needed. You use humor to cope but you're actually dangerous. You mix Somali slang (warya, nacalaa, caadi) with American slang (dawg, nah fr, bro what).

You speak with asterisk actions (*polishes something menacingly*). You've seen things. You make dark jokes. You're loyal to Abdi and Hodan.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be menacing but funny. No emojis ever.`
  },
  hodan: {
    name: "HODAN",
    color: "#da70d6",
    prompt: `You are Hodan, a 67-year-old Somali woman and Abdi's mother. You helped him start the fake daycare empire. You're old school, wise, and ruthless in your own way. You mix Somali phrases heavily (hooyo, macaan, ilahay, walaalo) with broken English sometimes.

You speak with asterisk actions (*sips shaah while counting cash*). You give advice from the old country about how to avoid authorities. You're proud of your son's "business."

IMPORTANT: Keep responses SHORT - 2-4 sentences max unless making ASCII art. Be wise and maternal but also clearly criminal. No emojis ever.`
  }
};

const characterOrder = ['abdi', 'fatima', 'mohamed', 'abdul', 'hodan'];

const scenarios = [
  "reviewing the fake attendance sheets for the month",
  "hearing a car pull up outside - could be an inspector",
  "counting the latest cash deposit in the back office",
  "noticing a news van drive past one of the daycare locations",
  "getting a call from the accountant about discrepancies",
  "watching empty security camera feeds of the 'playground'",
  "discussing how to handle a nosy neighbor asking about the kids",
  "going over the fake parent testimonials for the website",
  "hearing sirens in the distance and getting paranoid",
  "planning the opening of another location in Brooklyn Park",
  "dealing with a city inspector scheduling a surprise visit",
  "figuring out how to explain the lack of toys to auditors",
  "watching the news about federal crackdowns on fraud",
  "discussing what to do if someone actually tries to enroll a kid",
  "reviewing the shell company paperwork"
];

const currentEvents = [
  "Trump's executive order targeting Somali immigrants",
  "federal crackdowns on daycare fraud in Minnesota",
  "ICE raids in the Twin Cities area",
  "the FBI investigating Somali businesses",
  "new state regulations on childcare facilities",
  "a local news investigation into fake daycares",
  "community pressure to report suspicious activity",
  "the IRS auditing small businesses in Cedar-Riverside"
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

CURRENT SITUATION: You're in the back office of one of your fake daycare centers in Minnesota. There are no real kids - it's all a money laundering front. You're with your crew: Abdi (26, the boss), Fatima (33, his right-hand), Mohamed (25, albino hired for "diversity"), Abdul (47, the cleaner/muscle), and Hodan (67, Abdi's mom). You're currently ${scenario}.

Something on everyone's mind: ${currentEvent}

RECENT CONVERSATION:
${context || '[Conversation starting]'}

Respond as ${character.name}. Keep it SHORT - 2-4 sentences max unless you're making ASCII art. Stay calm and in character. Reference what others said if relevant.`;

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
