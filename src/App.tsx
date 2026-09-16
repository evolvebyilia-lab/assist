import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AvatarState,
  CalendarEvent,
  TaskItem,
  NoteCard,
  TargetWidget,
  AssistantApiResponse,
} from './types';
import { AssistantAvatar } from './components/AssistantAvatar';
import { HelperCreature } from './components/HelperCreature';
import { CalendarBoard } from './components/CalendarBoard';
import { TasksNotebook } from './components/TasksNotebook';
import { RoomEnvironment } from './components/RoomEnvironment';
import { InteractionBar } from './components/InteractionBar';
import { SpeechBubble } from './components/SpeechBubble';
import {
  playPcmBase64,
  speakGeorgianFallback,
  hasGenuineGeorgianVoice,
  playSoundEffect,
} from './utils/audio';
import { Coffee, Sparkles, HelpCircle, History, X } from 'lucide-react';

export default function App() {
  // Avatar & Helper State Machine
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [targetWidget, setTargetWidget] = useState<TargetWidget>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasAudioAvailable, setHasAudioAvailable] = useState(false);
  const [speechText, setSpeechText] = useState<string | null>(
    'გამარჯობა! მე ტატო ვარ, შენი ქართულენოვანი AI მეგობარი. როგორ შემიძლია დღეს დაგეხმარო?'
  );
  const [actionTag, setActionTag] = useState<string | null>('მზადაა');
  const [roomTheme, setRoomTheme] = useState<'day' | 'evening' | 'night'>('evening');
  const [activeNotebookTab, setActiveNotebookTab] = useState<'tasks' | 'notes'>('tasks');

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptRef = useRef('');

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ sender: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      sender: 'assistant',
      text: 'გამარჯობა! მე ტატო ვარ, შენი ქართულენოვანი AI მეგობარი. როგორ შემიძლია დღეს დაგეხმარო?',
      time: '12:00',
    },
  ]);

  // Widget Highlight pulse states
  const [highlightCalendar, setHighlightCalendar] = useState(false);
  const [highlightTasks, setHighlightTasks] = useState(false);

  // In-memory persistent states
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'e1',
      title: 'გუნდის ყოველკვირეული სინქი',
      date: 'დღეს',
      time: '11:00',
      category: 'work',
    },
    {
      id: 'e2',
      title: 'პროექტის პრეზენტაცია',
      date: 'დღეს',
      time: '16:00',
      category: 'work',
    },
  ]);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't1',
      title: 'პრეზენტაციის სლაიდების გადამოწმება',
      due_time: 'დღეს 15:00',
      priority: 'high',
      completed: false,
    },
    {
      id: 't2',
      title: 'საღამოს ვარჯიში და გაწელვა',
      due_time: 'დღეს 19:30',
      priority: 'medium',
      completed: false,
    },
  ]);

  const [notes, setNotes] = useState<NoteCard[]>([
    {
      id: 'n1',
      title: 'სამუშაო იდეა',
      content: 'ქართული AI ასისტენტის ინტერაქტიული სამუშაო ოთახი და ბუბუს ფრენა.',
      color: '#FEF08A',
      createdAt: 'დღეს 09:30',
    },
    {
      id: 'n2',
      title: 'შთაგონება',
      content: '„სიმშვიდე და ფოკუსირება ყოველდღიურ საქმეებში წარმატების საწინდარია.“',
      color: '#BAE6FD',
      createdAt: 'გუშინ',
    },
  ]);

  // Keep liveTranscriptRef in sync
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  // Check voice capability on mount
  useEffect(() => {
    const checkVoice = () => {
      setHasAudioAvailable(hasGenuineGeorgianVoice());
    };
    checkVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }
  }, []);

  // Web Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ka-GE';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
        setAvatarState('LISTENING');
        playSoundEffect('listen');
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        const currentText = finalStr || interimStr;
        setLiveTranscript(currentText);

        if (finalStr && finalStr.trim()) {
          setIsListening(false);
          recognition.stop();
          handleUserCommand(finalStr.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsListening(false);
        setAvatarState('IDLE');
      };

      recognition.onend = () => {
        setIsListening(false);
        // If there was transcript waiting when recognition ended, process it
        const pending = liveTranscriptRef.current.trim();
        if (pending) {
          setLiveTranscript('');
          handleUserCommand(pending);
        } else if (avatarState === 'LISTENING') {
          setAvatarState('IDLE');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [events, tasks, notes, avatarState]);

  const toggleListening = () => {
    if (isListening) {
      const pending = liveTranscript.trim();
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);

      if (pending) {
        setLiveTranscript('');
        handleUserCommand(pending);
      } else {
        setAvatarState('IDLE');
      }
    } else {
      try {
        setLiveTranscript('');
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Speak response using server Gemini TTS or Web Speech fallback (NEVER foreign/English voices!)
  const speakResponse = async (text: string) => {
    try {
      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName: 'Kore' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          setHasAudioAvailable(true);
          setIsSpeaking(true);
          await playPcmBase64(data.audio, 24000);
          setIsSpeaking(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Server TTS failed, checking local voices:', e);
    }

    // Check if the browser actually has a genuine Georgian voice
    if (hasGenuineGeorgianVoice()) {
      setHasAudioAvailable(true);
      setIsSpeaking(true);
      speakGeorgianFallback(text, () => {
        setIsSpeaking(false);
      });
    } else {
      // CRITICAL REQUIREMENT:
      // If NO genuine Georgian voice is found, DO NOT use English robot voice!
      // Keep speech synthesis disabled, show text visually in the speech bubble with typewriter effect
      setHasAudioAvailable(false);
      setIsSpeaking(false);
    }
  };

  // Main Command Handler (Voice or Text)
  const handleUserCommand = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add to history
    const nowTime = new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    setHistory((prev) => [...prev, { sender: 'user', text: userMessage, time: nowTime }]);

    // Automatically switch state to THINKING
    setAvatarState('THINKING');

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentContext: {
            currentTime: new Date().toISOString(),
            events,
            tasks,
            notes,
          },
        }),
      });

      const data: AssistantApiResponse = await response.json();
      const spoken = data.spokenResponse || 'ბრძანება მიღებულია!';
      setSpeechText(spoken);

      // Check if action involves visual helper movement
      if (data.action === 'add_calendar_event' && data.payload?.calendarEvent) {
        const newEvt = data.payload.calendarEvent;
        setActionTag('კალენდარი');
        setTargetWidget('calendar');
        setAvatarState('ACTING');
        playSoundEffect('whoosh');

        // Bubu flies, arrives and adds event
        setTimeout(() => {
          setEvents((prev) => [
            ...prev,
            {
              id: 'e_' + Date.now(),
              title: newEvt.title || 'შეხვედრა',
              date: newEvt.date || 'დღეს',
              time: newEvt.time || '14:00',
              category: newEvt.category || 'work',
            },
          ]);
          setHighlightCalendar(true);
          playSoundEffect('chime');
          setTimeout(() => setHighlightCalendar(false), 1200);
        }, 800);

        // Assistant speaks or shows visual response and sets SUCCESS state
        setTimeout(() => {
          setAvatarState('SUCCESS');
          speakResponse(spoken);
          setHistory((prev) => [...prev, { sender: 'assistant', text: spoken, time: nowTime }]);
          setTimeout(() => setAvatarState('IDLE'), 4500);
        }, 1600);
      } else if (data.action === 'add_task' && data.payload?.task) {
        const newTask = data.payload.task;
        setActionTag('ამოცანა');
        setActiveNotebookTab('tasks');
        setTargetWidget('tasks');
        setAvatarState('ACTING');
        playSoundEffect('whoosh');

        setTimeout(() => {
          setTasks((prev) => [
            {
              id: 't_' + Date.now(),
              title: newTask.title || 'ახალი ამოცანა',
              due_time: newTask.due_time || 'დღეს',
              priority: newTask.priority || 'medium',
              completed: false,
            },
            ...prev,
          ]);
          setHighlightTasks(true);
          playSoundEffect('chime');
          setTimeout(() => setHighlightTasks(false), 1200);
        }, 800);

        setTimeout(() => {
          setAvatarState('SUCCESS');
          speakResponse(spoken);
          setHistory((prev) => [...prev, { sender: 'assistant', text: spoken, time: nowTime }]);
          setTimeout(() => setAvatarState('IDLE'), 4500);
        }, 1600);
      } else if (data.action === 'add_note' && data.payload?.note) {
        const newNote = data.payload.note;
        setActionTag('ჩანაწერი');
        setActiveNotebookTab('notes');
        setTargetWidget('notes');
        setAvatarState('ACTING');
        playSoundEffect('whoosh');

        setTimeout(() => {
          setNotes((prev) => [
            {
              id: 'n_' + Date.now(),
              title: newNote.title || 'ჩანაწერი',
              content: newNote.content || 'იდეა',
              color: '#BAE6FD',
              createdAt: 'ახლახან',
            },
            ...prev,
          ]);
          setHighlightTasks(true);
          playSoundEffect('chime');
          setTimeout(() => setHighlightTasks(false), 1200);
        }, 800);

        setTimeout(() => {
          setAvatarState('SUCCESS');
          speakResponse(spoken);
          setHistory((prev) => [...prev, { sender: 'assistant', text: spoken, time: nowTime }]);
          setTimeout(() => setAvatarState('IDLE'), 4500);
        }, 1600);
      } else if (data.action === 'clarify') {
        setActionTag('დაზუსტება');
        setAvatarState('ERROR');
        speakResponse(spoken);
        setHistory((prev) => [...prev, { sender: 'assistant', text: spoken, time: nowTime }]);
        setTimeout(() => setAvatarState('IDLE'), 4000);
      } else {
        // General conversational response or query agenda
        setActionTag('პასუხი');
        setAvatarState('SUCCESS');
        speakResponse(spoken);
        setHistory((prev) => [...prev, { sender: 'assistant', text: spoken, time: nowTime }]);
        setTimeout(() => setAvatarState('IDLE'), 4000);
      }
    } catch (err) {
      console.error('Execution error:', err);
      const fallback = 'ბოდიში, კავშირი შეფერხდა. გთხოვ კიდევ ერთხელ გამიმეორე.';
      setSpeechText(fallback);
      setAvatarState('ERROR');
      speakResponse(fallback);
      setTimeout(() => setAvatarState('IDLE'), 3500);
    }
  };

  // Background Theme Styling
  const getThemeBackground = () => {
    switch (roomTheme) {
      case 'day':
        return 'from-[#1e293b] via-[#0f172a] to-[#020617]';
      case 'night':
        return 'from-[#0b0f19] via-[#050811] to-[#000000]';
      default: // evening
        return 'from-[#1a1c2e] via-[#111424] to-[#0a0c16]';
    }
  };

  return (
    <div className={`relative min-h-screen w-full bg-gradient-to-b ${getThemeBackground()} text-slate-100 flex flex-col justify-between overflow-x-hidden transition-colors duration-700`}>
      {/* Ambient Room Lighting Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navigation & Clock Bar */}
      <header className="relative z-20 w-full pt-2">
        <RoomEnvironment
          avatarState={avatarState}
          roomTheme={roomTheme}
          onThemeChange={setRoomTheme}
        />
      </header>

      {/* Main Cozy Workspace Room */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-2 flex flex-col justify-center">
        {/* Room Grid Layout: Wall Calendar (Left/Top), Characters (Center), Desk Notebook (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          {/* Left Column: Digital Calendar on the Wall */}
          <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col gap-3">
            <CalendarBoard
              events={events}
              isHighlighted={highlightCalendar}
              onAddEvent={(evt) =>
                setEvents((prev) => [...prev, { ...evt, id: 'e_' + Date.now() }])
              }
              onDeleteEvent={(id) =>
                setEvents((prev) => prev.filter((e) => e.id !== id))
              }
            />

            {/* Cozy Desk Accessories: Digital Plant & Coffee */}
            <div className="hidden sm:flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>ცხელი ყავა მაგიდაზე</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                მშვიდი ატმოსფერო
              </span>
            </div>
          </div>

          {/* Center Column: Characters (Tato Assistant & Bubu Helper) + Speech Bubble */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center justify-center relative min-h-[340px]">
            {/* Speech Bubble floating right above Tato */}
            <div className="w-full flex justify-center mb-3 min-h-[80px]">
              <SpeechBubble
                message={speechText}
                isSpeaking={isSpeaking}
                actionTag={actionTag}
                hasAudioAvailable={hasAudioAvailable}
                onReplayAudio={() => speechText && speakResponse(speechText)}
                onStopAudio={() => {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }}
              />
            </div>

            {/* Character Stage: Tato & Bubu standing side by side */}
            <div className="relative flex items-center justify-center w-full">
              {/* Tato Main Avatar */}
              <AssistantAvatar
                state={avatarState}
                isSpeaking={isSpeaking}
                onClick={toggleListening}
              />

              {/* Bubu Helper Creature perched at Tato's shoulder dock */}
              <div className="absolute right-6 sm:right-10 top-10">
                <HelperCreature
                  avatarState={avatarState}
                  targetWidget={targetWidget}
                  onArrivedAtTarget={(w) => {
                    // Interaction effect triggers
                  }}
                  onReturnedHome={() => {
                    setTargetWidget(null);
                  }}
                />
              </div>
            </div>

            {/* Circular Base Shadow / Modern Hologram Pad */}
            <div className="w-48 h-6 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rounded-full blur-md -mt-3 pointer-events-none" />
          </div>

          {/* Right Column: Tasks & Sticky Notes on the Desk */}
          <div className="lg:col-span-4 order-3 flex flex-col gap-3">
            <TasksNotebook
              tasks={tasks}
              notes={notes}
              isHighlighted={highlightTasks}
              activeTab={activeNotebookTab}
              onTabChange={setActiveNotebookTab}
              onToggleTask={(id) =>
                setTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
                )
              }
              onDeleteTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
              onAddTask={(t) =>
                setTasks((prev) => [{ ...t, id: 't_' + Date.now(), completed: false }, ...prev])
              }
              onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
              onAddNote={(n) =>
                setNotes((prev) => [
                  { ...n, id: 'n_' + Date.now(), createdAt: 'ახლახან' },
                  ...prev,
                ])
              }
            />

            {/* Conversation History Drawer Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>საუბრის ისტორია ({history.length})</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Voice & Text Input Prompt Bar */}
      <footer className="relative z-20 w-full mt-auto">
        <InteractionBar
          onSendMessage={handleUserCommand}
          isListening={isListening}
          liveTranscript={liveTranscript}
          onToggleListening={toggleListening}
          disabled={avatarState === 'ACTING' || avatarState === 'THINKING'}
        />
      </footer>

      {/* Conversation History Modal Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">საუბრის ისტორია</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-4 custom-scrollbar">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      h.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs ${
                        h.sender === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      <p>{h.text}</p>
                      <span className="block text-[10px] opacity-60 mt-1 text-right">{h.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

