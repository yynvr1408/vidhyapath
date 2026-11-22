import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  Camera,
  Volume2,
  RefreshCw,
  HelpCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  concepts?: { id: string; title: string }[];
  chapterId?: string;
  conceptId?: string;
  timestamp: number;
}

function generateFallbackReply(
  query: string,
  topic: any,
  lang: string
): { answer: string; concepts?: Array<{ id: string; title: string }> } {
  const clean = query.trim().toLowerCase();

  // 1. Greetings
  if (/^(hi|hello|hlo|hey|namaste|నమస్కారం|హలో|नमस्ते)\b/i.test(clean)) {
    if (lang === 'te') {
      return {
        answer: `నమస్కారం! నేను మీ విద్యాపథ్ AI ట్యూటర్‌ని. మీ 10వ తరగతి గణిత పాఠం **${topic?.title || 'వాస్తవ సంఖ్యలు'}** లోని ఏ సందేహమైనా నన్ను అడగండి — ఉదాహరణకు 'యూక్లిడ్ భాగహార న్యాయం' లేదా 'ప్రధాన కారణాంకాలు'. నేను దశలవారీగా వివరిస్తాను!`,
        concepts: topic?.cards?.map((c: any) => ({ id: c.id, title: c.heading })),
      };
    } else if (lang === 'hi') {
      return {
        answer: `नमस्ते! मैं आपका विद्यापथ AI ट्यूटर हूँ। कक्षा 10 गणित के अध्याय **${topic?.title || 'वास्तविक संख्याएँ'}** के बारे में कोई भी प्रश्न पूछें। मैं आपको चरण-दर-चरण समझाऊँगा!`,
        concepts: topic?.cards?.map((c: any) => ({ id: c.id, title: c.heading })),
      };
    } else {
      return {
        answer: `Hello! I am your Vidyapath AI Tutor. Ask me any question or concept from Class 10 Mathematics **${topic?.title || 'Real Numbers'}** (e.g. Euclid's Division Lemma, Fundamental Theorem of Arithmetic). I will guide you step by step!`,
        concepts: topic?.cards?.map((c: any) => ({ id: c.id, title: c.heading })),
      };
    }
  }

  // 2. Search concept cards in current topic or across pack
  const cards = topic?.cards || [];
  const matchedCard = cards.find((c: any) => {
    const heading = (c.heading || '').toLowerCase();
    const concept = (c.conceptText || '').toLowerCase();
    const words = clean.split(/\s+/).filter((w: string) => w.length > 2);
    return words.some((w: string) => heading.includes(w) || concept.includes(w));
  }) || cards[0];

  if (matchedCard) {
    const isTe = lang === 'te';
    const isHi = lang === 'hi';
    const steps = matchedCard.workedExample?.steps
      ? matchedCard.workedExample.steps.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n')
      : '';

    const answer = isTe
      ? `### **${matchedCard.heading}**\n\n${matchedCard.conceptText}\n\n${
          matchedCard.workedExample
            ? `### **సాధించిన ఉదాహరణ:**\n*సమస్య:* ${matchedCard.workedExample.problem}\n\n${steps}\n\n**తుది జవాబు:** ${matchedCard.workedExample.finalAnswer}\n\n`
            : ''
        }### **ముఖ్య గమనిక:**\n${matchedCard.keyTakeaway}\n\n*ఈ వివరణ అర్థమైందా? మరింత సాధన చేద్దామా?*`
      : isHi
      ? `### **${matchedCard.heading}**\n\n${matchedCard.conceptText}\n\n${
          matchedCard.workedExample
            ? `### **हल किया गया उदाहरण:**\n*प्रश्न:* ${matchedCard.workedExample.problem}\n\n${steps}\n\n**अंतिम उत्तर:** ${matchedCard.workedExample.finalAnswer}\n\n`
            : ''
        }### **महत्वपूर्ण बिंदु:**\n${matchedCard.keyTakeaway}\n\n*क्या यह समझ आया? क्या आप एक और उदाहरण देखना चाहते हैं?*`
      : `### **${matchedCard.heading}**\n\n${matchedCard.conceptText}\n\n${
          matchedCard.workedExample
            ? `### **Worked Example:**\n*Problem:* ${matchedCard.workedExample.problem}\n\n${steps}\n\n**Final Answer:** ${matchedCard.workedExample.finalAnswer}\n\n`
            : ''
        }### **Key Takeaway:**\n${matchedCard.keyTakeaway}\n\n*Does this explanation make sense, or would you like to see another example?*`;

    return {
      answer,
      concepts: cards.map((c: any) => ({ id: c.id, title: c.heading })),
    };
  }

  // 3. General Educational Socratic Guidance
  return {
    answer: lang === 'te'
      ? `### **భావన వివరణ: ${query}**\n\n1. **ముఖ్య సూత్రం:** ఇచ్చిన లెక్కలోని విలువలను గుర్తించి, ప్రాథమిక సూత్రాన్ని వర్తింపజేయండి.\n2. **దశలవారీ పరిష్కారం:** ప్రతి దశను స్పష్టంగా క్రమపద్ధతిలో లెక్కించండి.\n3. **సరిచూడండి:** వచ్చిన జవాబు సరిగ్గా ఉందో లేదో నిబంధనలతో పోల్చండి.\n\nమీరు ఈ సమస్యలో ఏ దశ వద్ద సందేహం కలిగి ఉన్నారో చెప్పండి, నేను సహాయం చేస్తాను!`
      : lang === 'hi'
      ? `### **अवधारणा: ${query}**\n\n1. **मूल सूत्र:** दिए गए मानों को पहचानें और संबंधित सूत्र का उपयोग करें।\n2. **चरणबद्ध हल:** प्रत्येक चरण को ध्यानपूर्वक हल करें।\n3. **जांच:** अपने उत्तर का सत्यापन करें।\n\nबताएं कि आपको किस चरण में सहायता चाहिए!`
      : `### **Concept Explanation: ${query}**\n\n1. **Core Principle:** Identify the given values and formula for this Class 10 topic.\n2. **Step-by-Step:** Apply the mathematical steps systematically.\n3. **Verification:** Check remainder conditions and signs.\n\nWhich specific step would you like me to walk through?`,
    concepts: topic?.cards?.map((c: any) => ({ id: c.id, title: c.heading })),
  };
}

export const AiTutorScreen: React.FC = () => {
  const {
    pack,
    selectedTopicId,
    selectedConceptId,
    currentLanguage,
    selectTopic,
    activeLearner,
    t,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);

  // Active selected chapter state
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    return selectedTopicId || pack?.topics?.[0]?.id || 'ch1_real_numbers';
  });

  const activeTopic = pack?.topics?.find((t) => t.id === activeChapterId) || pack?.topics?.[0];

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting & concepts for the selected chapter
  useEffect(() => {
    const chapterTitle = activeTopic?.title || 'Chapter 1';
    
    // Extract concepts
    const concepts = activeTopic?.cards
      ? activeTopic.cards.map((c) => ({ id: c.id, title: c.heading }))
      : (activeTopic?.skills || []).map((s, idx) => ({ id: `s_${idx}`, title: s.replace(/_/g, ' ') }));

    const initialGreeting =
      currentLanguage === 'hi'
        ? `नमस्ते ${activeLearner?.nickname || 'विद्यार्थी'}! मैं आपका विद्यापथ AI ट्यूटर हूँ। हम **${chapterTitle}** सीख रहे हैं। नीचे किसी भी अवधारणा पर टैप करें या अपना कोई भी प्रश्न पूछें:`
        : currentLanguage === 'en'
        ? `Hello ${activeLearner?.nickname || 'Learner'}! I am your Vidyapath AI Tutor. We are studying **${chapterTitle}**. Tap any concept below or ask any question:`
        : `నమస్కారం ${activeLearner?.nickname || 'విద్యార్థి'}! నేను మీ విద్యాపథ్ AI ట్యూటర్‌ని. మనం ప్రస్తుతం **${chapterTitle}** చదువుకుంటున్నాము. ప్రారంభించడానికి కింద ఏదైనా భావనపై నొక్కండి లేదా మీ సందేహాన్ని అడగండి:`;

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'tutor',
        text: initialGreeting,
        concepts: concepts,
        chapterId: activeTopic?.id,
        timestamp: Date.now(),
      },
    ]);

    // If a concept was pre-selected from syllabus screen, trigger it!
    if (selectedConceptId) {
      handleAskConcept(selectedConceptId, activeTopic?.id);
    }
  }, [activeChapterId, currentLanguage, pack]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleAskConcept = async (conceptTitleOrId: string, chapterId?: string, mode?: string) => {
    const chId = chapterId || activeChapterId;
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      text: conceptTitleOrId,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubt: conceptTitleOrId,
          conceptTitle: conceptTitleOrId,
          chapterId: chId,
          subject: pack?.subject || 'Mathematics',
          packId: pack?.id || 'te-10-maths-ap',
          language: currentLanguage,
          mode: mode || 'explain',
        }),
      });

      const data = await res.json();
      let replyText = data.answer || data.reply;
      let concepts = data.concepts;

      if (!replyText || !res.ok) {
        const fallback = generateFallbackReply(conceptTitleOrId, activeTopic, currentLanguage);
        replyText = fallback.answer;
        concepts = fallback.concepts;
      }

      const tutorMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'tutor',
        text: replyText,
        concepts: concepts,
        chapterId: data.chapterId || chId,
        conceptId: data.conceptId || conceptTitleOrId,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      const fallback = generateFallbackReply(conceptTitleOrId, activeTopic, currentLanguage);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'tutor',
          text: fallback.answer,
          concepts: fallback.concepts,
          chapterId: chId,
          conceptId: conceptTitleOrId,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || loading) return;

    setInputText('');
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubt: query,
          chapterId: activeChapterId,
          subject: pack?.subject || 'Mathematics',
          packId: pack?.id || 'te-10-maths-ap',
          language: currentLanguage,
        }),
      });

      const data = await res.json();
      let replyText = data.answer || data.reply;
      let concepts = data.concepts;

      if (!replyText || !res.ok) {
        const fallback = generateFallbackReply(query, activeTopic, currentLanguage);
        replyText = fallback.answer;
        concepts = fallback.concepts;
      }

      const tutorMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'tutor',
        text: replyText,
        concepts: concepts,
        chapterId: data.chapterId || activeChapterId,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      const fallback = generateFallbackReply(query, activeTopic, currentLanguage);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'tutor',
          text: fallback.answer,
          concepts: fallback.concepts,
          chapterId: activeChapterId,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Hybrid TTS Audio Player
  const handleListen = async (text: string, msgId: string) => {
    if (activeAudioPlaying === msgId) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setActiveAudioPlaying(null);
      return;
    }

    setActiveAudioPlaying(msgId);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.replace(/[#*`_]/g, ''),
          language: currentLanguage,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setActiveAudioPlaying(null);
        audio.onerror = () => setActiveAudioPlaying(null);
        audio.play();
        return;
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    // Web Speech Synthesis Fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'en' ? 'en-IN' : 'te-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setActiveAudioPlaying(null);
      utterance.onerror = () => setActiveAudioPlaying(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setActiveAudioPlaying(null);
    }
  };

  // Voice Input (Web Speech API)
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser. Please type your doubt.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'en' ? 'en-IN' : 'te-IN';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setInputText(speechText);
    };
    recognition.start();
  };

  // Photo Upload Simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputText(`[Photo Attached: ${file.name}] Explain this problem step-by-step.`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)] max-w-4xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
      {/* AI Tutor Header with Chapter Selector */}
      <div className="shrink-0 px-4 py-3 md:px-6 md:py-3.5 bg-gradient-to-r from-[#0F766E] to-[#115E59] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-t-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-base md:text-lg tracking-tight">
              {t.navAiTutor || 'AI Academic Tutor'}
            </h3>
            <p className="text-[11px] text-[#CCFBF1] font-medium">
              Socratic Concept Guided Learning • {currentLanguage.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Chapter Selection Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-[#CCFBF1] font-semibold hidden sm:inline">Chapter:</label>
          <select
            value={activeChapterId}
            onChange={(e) => setActiveChapterId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
          >
            {(pack?.topics || []).map((t, idx) => (
              <option key={t.id} value={t.id} className="text-[#0F172A] bg-white">
                {idx + 1}. {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 sm:px-6 py-4 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => {
          const isStudent = msg.sender === 'student';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div className="flex items-start space-x-2.5 max-w-[92%] sm:max-w-[85%]">
                {!isStudent && (
                  <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 md:p-5 rounded-2xl shadow-xs transition-all ${
                    isStudent
                      ? 'bg-[#0F766E] text-white rounded-tr-none'
                      : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-none space-y-3'
                  }`}
                >
                  {/* Clean Markdown Formatted Response */}
                  <div className="text-sm md:text-base leading-relaxed space-y-2.5 break-words">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-extrabold text-sm md:text-base text-[#0F766E] pt-1">
                            {paragraph.replace(/^###\s*/, '')}
                          </h4>
                        );
                      }
                      if (paragraph.includes('\n1.') || paragraph.startsWith('1.')) {
                        return (
                          <div key={pIdx} className="space-y-1.5 pl-1 bg-[#F0FDFA] p-3 rounded-xl border border-[#CCFBF1]">
                            {paragraph.split('\n').map((line, lIdx) => (
                              <p key={lIdx} className="text-xs md:text-sm font-medium text-[#134E4A]">
                                {line}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <p key={pIdx} className={isStudent ? 'text-white' : 'text-[#334155]'}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  {/* Clickable Concept Chips (When listing concepts for a chapter) */}
                  {msg.concepts && msg.concepts.length > 0 && (
                    <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        Tap a concept to start learning:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.concepts.map((concept) => (
                          <button
                            key={concept.id}
                            type="button"
                            onClick={() => handleAskConcept(concept.title, msg.chapterId)}
                            className="px-3.5 py-2 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4] rounded-xl text-xs font-bold shadow-2xs hover:scale-102 transition-all flex items-center space-x-1.5"
                          >
                            <span>{concept.title}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Bar for Tutor Explanations */}
                  {!isStudent && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9]">
                      {/* TTS Listen Button */}
                      <button
                        type="button"
                        onClick={() => handleListen(msg.text, msg.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          activeAudioPlaying === msg.id
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] animate-pulse'
                            : 'bg-[#F1F5F9] text-[#0F766E] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{activeAudioPlaying === msg.id ? 'Playing...' : '🔊 Listen'}</span>
                      </button>

                      {/* 4 One-Tap Follow-Up Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAskConcept(msg.text.slice(0, 50), msg.chapterId, 'simpler')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                        >
                          Explain even simpler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskConcept(msg.text.slice(0, 50), msg.chapterId, 'example')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                        >
                          Give another example
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAskConcept(`Teach me the next concept in this chapter`, msg.chapterId)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#99F6E4]"
                        >
                          Next concept →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isStudent && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs mt-0.5"
                    style={{ backgroundColor: activeLearner?.avatarColor || '#0F766E' }}
                  >
                    {activeLearner?.avatarEmoji || '👦'}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center space-x-2.5 text-[#0F766E] p-3 bg-white rounded-2xl border border-[#E2E8F0] w-fit shadow-xs animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-xs font-bold">Vidyapath AI is preparing your explanation…</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="shrink-0 sticky bottom-0 p-3 md:p-4 bg-white border-t border-[#E2E8F0] rounded-b-2xl z-10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          {/* Photo Doubt Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Ask via Photo / Diagram"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className="p-2.5 rounded-xl border border-[#CBD5E1] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors"
            title="Ask with Microphone"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentLanguage === 'hi'
                ? 'अपना गणित का संदेह यहाँ लिखें या बोलें...'
                : currentLanguage === 'en'
                ? 'Type your mathematics doubt or say "Chapter 1"...'
                : 'మీ లెక్కల సందేహాన్ని ఇక్కడ రాయండి లేదా మాట్లాడండి...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-sm font-medium"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-[#0F766E] hover:bg-[#0D6962] disabled:opacity-40 text-white font-bold rounded-xl shadow-xs transition-colors"
            title="Send Doubt"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
