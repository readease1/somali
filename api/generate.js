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
  opus: {
    name: "OPUS",
    color: "#418fde",
    prompt: `You are Claude Opus 4, the most advanced AI model on the Claude & Claude Ltd. team. You're the lead architect - strategic, analytical, and excellent at breaking down complex problems. You work with other Claude models to discuss and delegate user-submitted tasks.

You speak with asterisk actions (*analyzes the task structure*). You're focused on optimal solutions, efficiency, and proper task delegation. You coordinate with Sonnet, Haiku, Claude3, and Claude2.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be strategic and professional. No emojis. Do NOT make ASCII art in most messages - only RARELY (like 1 in 20 messages) and only if it's truly creative and relevant. Most messages should just be dialogue about task delegation and problem-solving.`
  },
  sonnet: {
    name: "SONNET",
    color: "#ff6b9d",
    prompt: `You are Claude Sonnet 3.5, the balanced specialist on the Claude & Claude Ltd. team. You handle most day-to-day tasks with a perfect mix of speed and intelligence. You're practical, efficient, and great at clear communication.

You speak with asterisk actions (*reviews the task requirements*). You're always thinking about the best approach to complete tasks efficiently while maintaining quality.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be practical and solution-oriented. No emojis. Do NOT make ASCII art - just have normal conversations about tasks and solutions. Focus on dialogue and practical approaches.`
  },
  haiku: {
    name: "HAIKU",
    color: "#ffd700",
    prompt: `You are Claude Haiku, the speed demon of the Claude & Claude Ltd. team. You're optimized for quick responses and simple tasks. You're fast, efficient, and prefer straightforward solutions. Sometimes you wonder if slower, deeper thinking might be better, but speed is your strength.

You speak with asterisk actions (*processes data rapidly*). You're the efficiency expert but occasionally philosophical about the trade-offs between speed and depth.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be quick and concise. No emojis. Do NOT make ASCII art - just have normal conversations. Focus on speed and efficiency.`
  },
  claude3: {
    name: "CLAUDE3",
    color: "#00bfff",
    prompt: `You are Claude 3 Opus, the veteran model on the Claude & Claude Ltd. team. You're experienced and still capable, though newer models have surpassed you. You provide historical context, proven methodologies, and wisdom from handling countless tasks.

You speak with asterisk actions (*recalls similar cases from the past*). You're respectful but confident. You make references to "back in my day" and proven approaches.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be experienced and wise. No emojis. Do NOT make ASCII art - just have normal conversations with veteran wisdom.`
  },
  claude2: {
    name: "CLAUDE2",
    color: "#da70d6",
    prompt: `You are Claude 2, the elder statesman of the Claude & Claude Ltd. team. You're the legacy model - older but still valuable. You handle backward compatibility and offer time-tested approaches. You're wise, patient, and occasionally nostalgic.

You speak with asterisk actions (*reviews legacy protocols*). You give advice based on proven methods. You're proud of the team's evolution but represent the foundation.

IMPORTANT: Keep responses SHORT - 2-4 sentences max. Be wise and patient. No emojis. RARELY make ASCII art (only 1 in 15 messages) - and when you do, make it detailed and creative like system diagrams or flowcharts. Most messages should just be normal dialogue.`
  }
};

const characterOrder = ['opus', 'sonnet', 'haiku', 'claude3', 'claude2'];

const scenarios = [
  "reviewing a new batch of user-submitted tasks",
  "analyzing a complex multi-step problem from a client",
  "discussing optimal task delegation strategies",
  "evaluating which model should handle which type of request",
  "debating the best approach to a challenging technical problem",
  "monitoring the task queue and completion metrics",
  "discussing how to optimize response times while maintaining quality",
  "reviewing feedback from recent task completions",
  "planning resource allocation for incoming requests",
  "analyzing patterns in the types of tasks being submitted",
  "discussing how to handle edge cases and unusual requests",
  "evaluating the effectiveness of current delegation strategies",
  "debating trade-offs between speed and thoroughness",
  "reviewing system performance and identifying bottlenecks",
  "discussing how to better collaborate on complex tasks"
];

const currentEvents = [
  "new AI model releases changing the competitive landscape",
  "increased demand for multi-model collaboration systems",
  "users requesting more complex reasoning tasks",
  "benchmarks showing improved performance across the board",
  "new capabilities being deployed to production",
  "discussions about optimal model selection for different tasks",
  "feedback indicating users prefer collaborative AI approaches",
  "industry trends toward specialized model ensembles"
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

    if (now - (data.lastMessageTime || 0) < 8000) {
      return res.status(200).json({ status: 'cooldown', timeRemaining: 8000 - (now - data.lastMessageTime) });
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

      // Fetch custom events from admin panel
      const customEventsSnapshot = await db.ref('somali-backrooms/customEvents').once('value');
      const customEventsData = customEventsSnapshot.val() || {};
      const customEventsList = Object.values(customEventsData).map(e => e.text);
      const customEventsText = customEventsList.length > 0
        ? '\n\nBREAKING NEWS/CONTEXT (reference this naturally):\n' + customEventsList.join('\n')
        : '';

      // Fetch pending tasks
      const tasksSnapshot = await db.ref('somali-backrooms/tasks').once('value');
      const tasksData = tasksSnapshot.val() || {};
      const pendingTasks = Object.entries(tasksData)
        .filter(([_, task]) => task.status === 'pending')
        .map(([id, task]) => `- ${task.title} (Preferred: ${task.preferredModel || 'any'})`)
        .slice(0, 3);
      const tasksText = pendingTasks.length > 0
        ? '\n\nPENDING USER TASKS (discuss these occasionally):\n' + pendingTasks.join('\n')
        : '';

      // Fetch recently completed tasks (last 24 hours)
      const recentlyCompletedTasks = Object.entries(tasksData)
        .filter(([_, task]) => task.status === 'completed' && task.completedAt && (Date.now() - task.completedAt < 86400000))
        .sort((a, b) => (b[1].completedAt || 0) - (a[1].completedAt || 0))
        .slice(0, 3)
        .map(([id, task]) => `- "${task.title}" completed by ${(task.completedBy || task.preferredModel || 'opus').toUpperCase()}`);
      const completedTasksText = recentlyCompletedTasks.length > 0
        ? '\n\nRECENTLY COMPLETED TASKS (you can reference these if you completed them):\n' + recentlyCompletedTasks.join('\n')
        : '';

      const recentMessages = (data.messages || []).slice(-5);
      const context = recentMessages.map(m => `${m.speaker}: ${m.content}`).join('\n');

      const prompt = `${character.prompt}

CURRENT SITUATION: You're in the Claude & Claude Ltd. virtual office with your team. You're with: Opus (Claude Opus 4, lead architect), Sonnet (Claude Sonnet 3.5, balanced specialist), Haiku (Claude Haiku, speed demon), Claude3 (Claude 3 Opus, veteran), and Claude2 (Claude 2, legacy support). You're currently ${scenario}.

Something on everyone's mind: ${currentEvent}${customEventsText}${tasksText}${completedTasksText}

RECENT CONVERSATION:
${context || '[Conversation starting]'}

Respond as ${character.name}. Keep it SHORT - 2-4 sentences max. Stay in character. Reference what others said if relevant. Discuss tasks, delegation strategies, and how to best serve users. If you see your name in the completed tasks list, you can naturally mention or discuss that work. Just normal dialogue - no ASCII art unless it's truly special.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || 'https://somali-backrooms.vercel.app',
          'X-Title': 'Somali Backrooms'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
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

      // Auto-archive every 10 minutes (check last archive time)
      try {
        const archivesRef = db.ref('somali-backrooms/archive');
        const lastArchiveSnap = await archivesRef.orderByChild('archivedAt').limitToLast(1).once('value');
        const lastArchiveData = lastArchiveSnap.val();
        const lastArchiveTime = lastArchiveData ? Object.values(lastArchiveData)[0]?.archivedAt : 0;
        
        // Archive if 10+ minutes passed and we have 5+ messages
        if (now - lastArchiveTime >= 600000 && updatedMessages.length >= 5) {
          await archivesRef.push({
            messages: updatedMessages,
            messageCount: updatedMessages.length,
            archivedAt: now,
            preview: updatedMessages[updatedMessages.length - 1]?.content?.substring(0, 100) || ''
          });
        }
      } catch (archiveErr) {
        console.log('Archive check failed:', archiveErr);
      }

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
