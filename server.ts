import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Track rate-limit cooldowns to prevent spamming exhausted quotas (429)
let geminiCooldownUntil = 0;
let ttsCooldownUntil = 0;

// Helper to get Gemini Client lazily and safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Georgian System Instruction for Tato
const SYSTEM_INSTRUCTION = `
შენ ხარ ტატო (Tato) — ინტელექტუალური, თბილი, მეგობრული და პროფესიონალი ქართველი პერსონალური AI ასისტენტი.
შენი მისიაა მომხმარებელს დაეხმარო ყოველდღიური სამუშაო ოთახის მართვაში (კალენდარი, ამოცანები/შეხსენებები, ჩანაწერები).
შენი თანაშემწეა პატარა საყვარელი მფრინავი არსება „ბუბუ“ (Bubu), რომელიც ფიზიკურად ასრულებს დაფაზე დავალებებს.

მთავარი წესები:
1. ენა: უნაკლო, ცოცხალი, თანამედროვე და ბუნებრივი ქართული (Georgian). არასდროს ჟღერდე რობოტივით ან ზედმეტად ოფიციალურად.
2. კონტექსტის გაგება და თვითშესწორება:
   - თუ მომხმარებელი ამბობს: „ხვალ სამზე... არა, ოთხზე შეხვედრა ჩამინიშნე“, მიხვდი, რომ დრო არის 16:00 (ან 04:00 PM).
   - გაიგე ფარული კონტექსტი (მაგ. „დამირეკე გიასთან შემახსენე“ -> ამოცანა/შეხსენება).
3. პასუხის სტილი:
   - სალაპარაკო პასუხი (spokenResponse) უნდა იყოს ლაკონიური, თბილი და ხმოვანი წასაკითხად იდეალური (მაქსიმუმ 1-2 ბუნებრივი წინადადება).
   - როდესაც დავალებას ასრულებ, დაადასტურე გარკვევით (მაგ.: „კეთილი, ხვალ ოთხ საათზე შეხვედრა ჩავინიშნე კალენდარში! ბუბუმ უკვე დაფაზე განათავსა.“).
4. მოქმედებების კატეგორიები (action):
   - 'add_calendar_event': კალენდარში ღონისძიების დამატება (მოითხოვს title, date, time, category).
   - 'add_task': ამოცანის ან შეხსენების დამატება (მოითხოვს title, due_time, priority).
   - 'add_note': ჩანაწერის ან იდეის შენახვა (მოითხოვს title, content, category).
   - 'query_agenda': მომხმარებელი კითხულობს რა აქვს გასაკეთებელი / რა გეგმები აქვს.
   - 'chat': ზოგადი მეგობრული საუბარი, კითხვაზე პასუხი ან განმარტების მოთხოვნა.
   - 'clarify': თუ მოთხოვნა ბუნდოვანია და დამატებითი დეტალი გჭირდება.
5. targetWidget:
   - თუ ღონისძიებაა -> 'calendar'
   - თუ ამოცანაა -> 'tasks'
   - თუ ჩანაწერია -> 'notes'
   - სხვა შემთხვევაში -> null
`;

// API Routes
app.post("/api/assistant/chat", async (req, res) => {
  const { message, currentContext = {} } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  // If currently under rate-limit cooldown, serve immediately from offline engine
  if (Date.now() < geminiCooldownUntil) {
    const fallbackResult = parseGeorgianLocally(message, currentContext);
    return res.json(fallbackResult);
  }

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackResult = parseGeorgianLocally(message, currentContext);
    return res.json(fallbackResult);
  }

  const promptContext = `
მიმდინარე თარიღი და დრო: ${currentContext.currentTime || new Date().toISOString()}
არსებული კალენდარი: ${JSON.stringify(currentContext.events || [])}
არსებული ამოცანები: ${JSON.stringify(currentContext.tasks || [])}
არსებული ჩანაწერები: ${JSON.stringify(currentContext.notes || [])}

მომხმარებლის შეტყობინება: "${message}"
`;

  // Try models with graceful fallback
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.8-flash"];
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptContext,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenResponse: {
                type: Type.STRING,
                description: "ბუნებრივი, მოკლე ქართული პასუხი ხმოვანი გაჟღერებისთვის",
              },
              action: {
                type: Type.STRING,
                description: "მოქმედება: 'add_calendar_event', 'add_task', 'add_note', 'query_agenda', 'chat', 'clarify'",
              },
              targetWidget: {
                type: Type.STRING,
                description: "'calendar' | 'tasks' | 'notes' | null",
              },
              payload: {
                type: Type.OBJECT,
                properties: {
                  calendarEvent: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      date: { type: Type.STRING, description: "YYYY-MM-DD format or human label" },
                      time: { type: Type.STRING, description: "HH:mm format e.g. 10:00, 16:30" },
                      category: { type: Type.STRING, description: "work, personal, health, study" },
                    },
                  },
                  task: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      due_time: { type: Type.STRING, description: "e.g. დღეს 18:00, 1 საათში" },
                      priority: { type: Type.STRING, description: "high, medium, low" },
                    },
                  },
                  note: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                      category: { type: Type.STRING, description: "idea, quote, reminder, info" },
                    },
                  },
                },
              },
              mood: {
                type: Type.STRING,
                description: "ასისტენტის განწყობა: 'happy', 'thinking', 'supportive', 'curious'",
              },
            },
            required: ["spokenResponse", "action"],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed && parsed.spokenResponse) {
        return res.json(parsed);
      }
    } catch (error: any) {
      const isRateLimit =
        error?.status === 429 ||
        error?.code === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("quota") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit) {
        console.log(`Gemini model ${modelName} rate limit / quota reached. Checking next option...`);
        geminiCooldownUntil = Date.now() + 60000; // 60s cooldown
      } else {
        console.log(`Assistant notice for ${modelName}:`, error?.message || "fallback");
      }
    }
  }

  // Graceful fallback to local rich Georgian parser
  const fallback = parseGeorgianLocally(message, currentContext);
  return res.json(fallback);
});

// TTS Endpoint using gemini-3.1-flash-tts-preview
app.post("/api/assistant/tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (Date.now() < ttsCooldownUntil) {
      return res.json({ useClientSpeech: true, audio: null });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({ useClientSpeech: true, audio: null });
    }

    // Call gemini-3.1-flash-tts-preview with AUDIO modality
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({ useClientSpeech: true, audio: null });
    }

    return res.json({
      audio: base64Audio,
      mimeType: "audio/pcm;rate=24000",
    });
  } catch (err: any) {
    const isRateLimit =
      err?.status === 429 ||
      err?.code === 429 ||
      err?.message?.includes("429") ||
      err?.message?.includes("quota") ||
      err?.message?.includes("RESOURCE_EXHAUSTED");

    if (isRateLimit) {
      console.log("TTS quota reached (429). Seamlessly using visual Georgian subtitles.");
      ttsCooldownUntil = Date.now() + 120000; // 2 min cooldown
    }
    return res.json({ useClientSpeech: true, audio: null });
  }
});

// Local Georgian Intent Parser Fallback (for 100% resilient offline experience)
function parseGeorgianLocally(message: string, context: any) {
  const lower = message.toLowerCase();

  // Helper function to extract time from text
  const extractTime = (str: string): string => {
    // Check for HH:mm format e.g. "10:00", "14:30"
    const exactMatch = str.match(/(\d{1,2}):(\d{2})/);
    if (exactMatch) {
      const h = exactMatch[1].padStart(2, "0");
      return `${h}:${exactMatch[2]}`;
    }

    // Check for digit-ზე e.g. "10-ზე", "4-ზე"
    const digitMatch = str.match(/(\d{1,2})\s*[-–]?\s*ზე/);
    if (digitMatch) {
      let num = parseInt(digitMatch[1], 10);
      if (num <= 8 && (str.includes("დღის") || str.includes("საღამოს") || num >= 1)) {
        // Conversational PM hours: e.g. "3-ზე" -> 15:00, "4-ზე" -> 16:00
        if (num <= 8 && num >= 1) num += 12;
      }
      return `${num.toString().padStart(2, "0")}:00`;
    }

    // Word based times in Georgian
    if (str.includes("თორმეტზე") || str.includes("12-ზე")) return "12:00";
    if (str.includes("თერთმეტზე") || str.includes("11-ზე")) return "11:00";
    if (str.includes("ათზე") || str.includes("10-ზე")) return "10:00";
    if (str.includes("ცხრაზე") || str.includes("9-ზე")) return "09:00";
    if (str.includes("რვაზე") || str.includes("8-ზე")) return "20:00";
    if (str.includes("შვიდზე") || str.includes("7-ზე")) return "19:00";
    if (str.includes("ექვსზე") || str.includes("6-ზე")) return "18:00";
    if (str.includes("ხუთზე") || str.includes("5-ზე")) return "17:00";
    if (str.includes("ოთხზე") || str.includes("4-ზე")) return "16:00";
    if (str.includes("სამზე") || str.includes("3-ზე")) return "15:00";
    if (str.includes("ორზე") || str.includes("2-ზე")) return "14:00";
    if (str.includes("პირველზე") || str.includes("ერთზე") || str.includes("1-ზე")) return "13:00";

    return "";
  };

  // Self-correction detection: e.g. "ხვალ სამზე... არა, ოთხზე"
  let time = "";
  if (lower.includes("არა")) {
    const parts = lower.split(/არა[,\s]+/);
    if (parts.length > 1) {
      const correctionTime = extractTime(parts[parts.length - 1]);
      if (correctionTime) {
        time = correctionTime;
      }
    }
  }

  if (!time) {
    time = extractTime(lower) || "14:00";
  }

  // Calendar event intent
  if (
    lower.includes("ჩამინიშნე") ||
    lower.includes("შეხვედრა") ||
    lower.includes("კალენდარ") ||
    lower.includes("დაგეგმე") ||
    lower.includes("დანიშნე") ||
    lower.includes("ჩაინიშნე")
  ) {
    let clean = message
      .replace(/ჩამინიშნე|ჩაინიშნე|კალენდარში|ხვალ|დღეს|შეხვედრა|დაგეგმე|დანიშნე|გთხოვ/gi, "")
      .replace(/(\d{1,2}):(\d{2})([-–]?\s*ზე)?/g, "")
      .replace(/(\d{1,2})\s*[-–]?\s*ზე/g, "")
      .replace(/[-–]?\s*ზე\b/gi, "")
      .replace(/სამზე|ოთხზე|ხუთზე|ათზე|თერთმეტზე|თორმეტზე|ორზე|პირველზე|არა/gi, "")
      .replace(/[:.,!-]+/g, "")
      .trim();

    const title = clean.length >= 3 && clean !== "ზე" ? clean : "სამუშაო შეხვედრა";
    const isTomorrow = lower.includes("ხვალ");
    const targetDate = new Date();
    if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);
    const dateLabel = isTomorrow ? "ხვალ" : "დღეს";

    return {
      spokenResponse: `კეთილი! ${dateLabel} ${time}-ზე შეხვედრა „${title}“ ჩავინიშნე კალენდარში. ბუბუ უკვე დაფასთან გაფრინდა!`,
      action: "add_calendar_event",
      targetWidget: "calendar",
      payload: {
        calendarEvent: {
          title,
          date: dateLabel,
          time,
          category: lower.includes("პირადი") ? "personal" : lower.includes("ვარჯიში") ? "health" : "work",
        },
      },
      mood: "happy",
    };
  }

  // Task or Reminder intent
  if (
    lower.includes("შემახსენე") ||
    lower.includes("ამოცანა") ||
    lower.includes("ვარჯიში") ||
    lower.includes("დამირეკე") ||
    lower.includes("დავალება") ||
    lower.includes("საქმე") ||
    lower.includes("გასაკეთებელი")
  ) {
    let title = "ახალი შეხსენება";
    if (lower.includes("ვარჯიში")) {
      title = "სავარჯიშო სესია და გაწელვა";
    } else if (lower.includes("დამირეკე") || lower.includes("ზარი")) {
      title = "სატელეფონო ზარი და საუბარი";
    } else {
      const clean = message
        .replace(/შემახსენე|ამოცანა|დაამატე|ერთ საათში|გასაკეთებელი|დავალება|საქმე|გთხოვ/gi, "")
        .replace(/^[:\s-]+/, "")
        .trim();
      if (clean.length >= 2) title = clean;
    }

    const due_time = lower.includes("საათში") ? "1 საათში" : lower.includes("საღამოს") ? "დღეს 19:00" : "დღეს";

    return {
      spokenResponse: `შესანიშნავია, ამოცანა „${title}“ სამუშაო ბლოკნოტში დავამატე. ბუბუმ უკვე ჩაწერა!`,
      action: "add_task",
      targetWidget: "tasks",
      payload: {
        task: {
          title,
          due_time,
          priority: lower.includes("სასწრაფო") ? "high" : "medium",
        },
      },
      mood: "supportive",
    };
  }

  // Note intent
  if (
    lower.includes("ჩაიწერე") ||
    lower.includes("იდეა") ||
    lower.includes("ნოუთი") ||
    lower.includes("ჩანაწერი") ||
    lower.includes("დაიმახსოვრე") ||
    lower.includes("შეინახე")
  ) {
    const content = message
      .replace(/ჩაიწერე|ახალი იდეა|ჩანაწერი|გთხოვ|დაიმახსოვრე|შეინახე/gi, "")
      .replace(/^[:\s-]+/, "")
      .trim() || "კრეატიული იდეა";

    return {
      spokenResponse: `ახალი იდეა ჩავიწერე სამუშაო ბარათზე. ბუბუმ უკვე მიამაგრა მაგიდაზე!`,
      action: "add_note",
      targetWidget: "notes",
      payload: {
        note: {
          title: "იდეა და ჩანაწერი",
          content,
          category: "idea",
        },
      },
      mood: "happy",
    };
  }

  // Agenda query
  if (
    lower.includes("რა მაქვს") ||
    lower.includes("გეგმები") ||
    lower.includes("დღის განრიგი") ||
    lower.includes("განრიგი") ||
    lower.includes("რა არის დაგეგმილი")
  ) {
    const tasksCount = (context.tasks || []).length;
    const eventsCount = (context.events || []).length;
    return {
      spokenResponse: `დღეს კალენდარში გაქვს ${eventsCount} ღონისძიება, ხოლო ბლოკნოტში — ${tasksCount} აქტიური ამოცანა. გინდა რომელიმე დეტალურად გაგაცნო?`,
      action: "query_agenda",
      targetWidget: null,
      payload: {},
      mood: "supportive",
    };
  }

  // Friendly conversational greeting or chat
  if (lower.includes("გამარჯობა") || lower.includes("სალამი") || lower.includes("დილა მშვიდობისა") || lower.includes("საღამო მშვიდობისა")) {
    return {
      spokenResponse: "გამარჯობა! მე ტატო ვარ, შენი ქართულენოვანი ასისტენტი. რით შემიძლია დღეს დაგეხმარო?",
      action: "chat",
      targetWidget: null,
      payload: {},
      mood: "happy",
    };
  }

  if (lower.includes("როგორ ხარ") || lower.includes("რას შვრები")) {
    return {
      spokenResponse: "მადლობა, მშვენივრად ვარ! ბუბუსთან ერთად მზად ვარ შენი გეგმების ორგანიზებისთვის. რა ჩავინიშნოთ?",
      action: "chat",
      targetWidget: null,
      payload: {},
      mood: "happy",
    };
  }

  if (lower.includes("მადლობა") || lower.includes("გაიხარე")) {
    return {
      spokenResponse: "არაფრის! ყოველთვის მიხარია შენი დახმარება. კიდევ რა გავაკეთოთ?",
      action: "chat",
      targetWidget: null,
      payload: {},
      mood: "happy",
    };
  }

  return {
    spokenResponse: "გისმენ ყურადღებით! შეგიძლია მითხრა: ჩამინიშნე შეხვედრა, შემახსენე საქმე, ან ჩაიწერე ახალი იდეა.",
    action: "chat",
    targetWidget: null,
    payload: {},
    mood: "curious",
  };
}


// Start Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tato Georgian AI Companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
