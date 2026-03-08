import React, { useState, useEffect } from 'react';
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from 'framer-motion';
import { Github, Heart, X, Terminal, Cat, User, MapPin, Mail, MessageSquare, Maximize2 } from 'lucide-react';

// --- Supabase Configuration ---
let supabaseUrl = '';
let supabaseKey = '';
try {
  supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
  supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
} catch (e) {
  // Graceful fallback for environments where import.meta is unavailable
}

// --- Basic Profanity Filter ---
const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'nigga', 'slut', 'whore', 'dick', 'cock', 'pussy', 'fag', 'faggot'];
const containsBadWords = (text) => {
  const normalizedText = text.toLowerCase();
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(normalizedText);
  });
};

// --- Deterministic Emoji Generator ---
// Assigns a consistent emoji based on the name string
const getEmoji = (name) => {
  const emojis = ['🪐', '☄️', '🌟', '🌙', '☁️', '🛸', '🛰️', '👾', '👻', '🦉', '🐾', '🌿', '🔮', '🎲', '🎹'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
};

// --- Hardware Details ---
const BoxNails = () => (
  <>
    <div className="absolute top-3 left-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute top-3 right-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
  </>
);

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
  }
};

// --- Quotes Data ---
const quotes = [
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "The quieter you become, the more you are able to hear.", author: "Rumi" },
  { text: "Smooth seas do not make skillful sailors.", author: "African Proverb" },
  { text: "To even have a chance of success, you must be willing to fail.", author: "Unknown" },
  { text: "What you seek is seeking you.", author: "Rumi" }
];

const reminders = [
  "Take care of yourself.",
  "Drink some water.",
  "Don’t overthink everything.",
  "You’ll figure it out.",
  "Keep going."
];

export default function App() {
  const { scrollY } = useScroll();
  
  const prefix = "welcome to the ";
  const suffix = "Void";
  const fullLength = prefix.length + suffix.length;
  
  const [typedChars, setTypedChars] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [reminder, setReminder] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- Leave a Mark State ---
  const [marks, setMarks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeavingMark, setIsLeavingMark] = useState(false);
  const [markName, setMarkName] = useState('');
  const [markText, setMarkText] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Fetch Marks on Load using Supabase REST API
  useEffect(() => {
    const fetchMarks = async () => {
      if (!supabaseUrl || !supabaseKey) {
        // Fallback for preview environment before DB is connected
        setMarks([
          { id: 1, name: "wanderer", message: "Found this place by accident. It's quiet here.", created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 2, name: "anonymous", message: "Leaving a footprint in the digital dust.", created_at: new Date(Date.now() - 3600000).toISOString() }
        ]);
        return;
      }
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/marks?select=*&order=created_at.desc&limit=50`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMarks(data);
        }
      } catch (error) {
        console.error("Failed to fetch marks");
      }
    };
    fetchMarks();
  }, []);

  // Submit Mark Handler using Supabase REST API
  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    if (!isHuman || !markText.trim() || isSubmitting) return;

    if (containsBadWords(markText) || containsBadWords(markName)) {
      setSubmitStatus("The void rejects this frequency.");
      setIsSubmitting(false);
      return;
    }

    const lastMarkTime = localStorage.getItem('void_last_mark');
    if (lastMarkTime && Date.now() - parseInt(lastMarkTime) < 3600000) {
      setSubmitStatus("You have left a mark recently. Let the dust settle.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    const finalName = markName.trim() || 'anonymous';
    const newMark = { name: finalName, message: markText.trim() };

    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/marks`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newMark)
        });

        if (!response.ok) {
          setSubmitStatus("Failed to leave mark. The void rejected it.");
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        setSubmitStatus("Failed to leave mark. The void rejected it.");
        setIsSubmitting(false);
        return;
      }
    }

    localStorage.setItem('void_last_mark', Date.now().toString());
    setMarks([{ ...newMark, created_at: new Date().toISOString(), id: Date.now() }, ...marks]);
    
    setIsSubmitting(false);
    setIsLeavingMark(false);
    setMarkText('');
    setMarkName('');
    setIsHuman(false);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
    if (latest > 20 && showReminder) setShowReminder(false);
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypedChars(prev => {
        if (prev >= fullLength) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 40); 
    return () => clearInterval(interval);
  }, [fullLength]);

  useEffect(() => {
    const quoteInterval = setInterval(() => setQuoteIndex((prev) => (prev + 1) % quotes.length), 15000);
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    setReminder(reminders[Math.floor(Math.random() * reminders.length)]);
    const showTimeout = setTimeout(() => setShowReminder(true), 2000);
    const hideTimeout = setTimeout(() => setShowReminder(false), 8000);
    return () => { clearTimeout(showTimeout); clearTimeout(hideTimeout); };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const timeParts = timeFormatter.formatToParts(time);
  const hours = timeParts.find(p => p.type === 'hour')?.value || '00';
  const minutes = timeParts.find(p => p.type === 'minute')?.value || '00';

  return (
    <div className="min-h-[200vh] flex flex-col bg-black font-mono text-white selection:bg-white selection:text-black relative overflow-hidden">
      
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        * { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.15) #000; }
      `}</style>

      {/* Header */}
      <header 
        className="fixed top-0 left-0 w-full py-3 px-6 z-40 flex items-center justify-between cursor-pointer text-sm md:text-base bg-black/40 backdrop-blur-md"
        onClick={scrollToTop}
      >
        <div className="flex items-center">
          <motion.div 
            animate={{ width: isScrolled ? 0 : "auto", opacity: isScrolled ? 0 : 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="pointer-events-none text-white/50 overflow-hidden whitespace-nowrap flex pr-2"
          >
            {prefix.split('').map((char, i) => <span key={i} style={{ whiteSpace: "pre" }}>{i < typedChars ? char : null}</span>)}
          </motion.div>
          <span className="text-white font-semibold flex" style={{ textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 25px rgba(255,255,255,0.5)' }}>
            {suffix.split('').map((char, i) => <span key={i} style={{ whiteSpace: "pre" }}>{prefix.length + i < typedChars ? char : null}</span>)}
          </span>
        </div>
        
        <div className="flex flex-col items-end relative">
          <div className="text-white/50 text-xs pointer-events-none flex items-center">
            <MapPin size={12} className="mr-1.5 opacity-70" strokeWidth={2} />
            <span>{hours}</span>
            <span className="mx-[2px]" style={{ opacity: time.getSeconds() % 2 === 0 ? 1 : 0 }}>:</span>
            <span>{minutes}</span>
          </div>
          <AnimatePresence>
            {showReminder && (
              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute top-full pt-3 flex flex-col items-end pointer-events-none right-0 -z-10"
              >
                <div className="text-white/50 text-[9px] md:text-[10px] tracking-widest font-mono whitespace-nowrap">
                  {reminder}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Void Space with Grid Layout & Animations */}
      <main className="flex-1 pt-32 md:pt-40 px-4 md:px-8 w-full relative z-10 flex justify-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl w-full pb-32 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          
          {/* About - Spans full width on desktop */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative border border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500 p-8 md:p-12 rounded-lg">
            <BoxNails />
            <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
              <User size={14} className="mr-3 opacity-40" /> About
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              This page exists mostly for myself.<br />
              Just a small place where I leave a few things behind.<br />
              Things I like, things I don’t, thoughts now and then.<br />
              Nothing more than that.
            </p>
          </motion.div>

          {/* Likes and Dislikes - Spans full width, splits internally */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative border border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500 p-8 md:p-12 rounded-lg">
            <BoxNails />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              <div>
                <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
                  <Heart size={14} className="mr-3 opacity-40" /> Likes
                </h2>
                <ul className="flex flex-col gap-4 text-white/70 text-sm md:text-base">
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Cats</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Exploring the internet</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Good books</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Space and tech</li>
                </ul>
              </div>
              <div>
                <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
                  <X size={14} className="mr-3 opacity-40" /> Dislikes
                </h2>
                <ul className="flex flex-col gap-4 text-white/70 text-sm md:text-base">
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Loud environments</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Pointless arguments</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Cluttered spaces</li>
                  <li className="flex items-start"><span className="text-white/20 mr-4">—</span> Humans</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Currently - Half width on desktop */}
          <motion.div variants={itemVariants} className="md:col-span-1 relative border border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500 p-8 md:p-12 rounded-lg flex flex-col">
            <BoxNails />
            <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
              <Terminal size={14} className="mr-3 opacity-40" /> Currently
            </h2>
            <p className="text-white/70 text-sm md:text-base italic font-serif flex-1 flex items-center">
              Trying to get a little better at things every day.
            </p>
          </motion.div>

          {/* Leave a Mark (Glimpse Panel) - Half width on desktop */}
          <motion.div variants={itemVariants} className="md:col-span-1 relative border border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500 p-8 md:p-12 rounded-lg flex flex-col">
            <BoxNails />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase flex items-center">
                <MessageSquare size={14} className="mr-3 opacity-40" /> Guestbook
              </h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-white/30 hover:text-white transition-colors p-2"
                title="Expand Guestbook"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-5">
              {marks.slice(0, 3).map((mark, idx) => (
                <div key={idx} className="flex items-start gap-3 text-white/60 text-sm italic font-serif">
                  <span className="opacity-70 mt-0.5" title={mark.name}>{getEmoji(mark.name)}</span>
                  <span className="line-clamp-2">"{mark.message}"</span>
                </div>
              ))}
              {marks.length === 0 && <p className="text-white/30 text-xs italic font-serif">Quiet...</p>}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full py-3 border border-white/10 hover:border-white/30 text-white/50 hover:text-white text-xs tracking-widest uppercase transition-colors rounded"
            >
              Open & Leave a Mark
            </button>
          </motion.div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-end pb-4 px-4 md:px-8 relative z-10">
        <div className="w-full max-w-2xl relative border border-white/20 bg-white/[0.01] rounded-lg flex items-center justify-center min-h-[140px]">
          <BoxNails />
          <AnimatePresence>
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="flex flex-col gap-2 w-full absolute px-8 md:px-12"
            >
              <p className="text-center italic text-white/70 text-xs md:text-sm leading-relaxed">
                <span className="font-serif text-white/60 mr-1">“</span>{quotes[quoteIndex].text}<span className="font-serif text-white/60 ml-1">”</span>
              </p>
              <span className="text-right text-white/40 text-[10px] md:text-xs tracking-tight mt-1">— {quotes[quoteIndex].author}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 px-8 py-3 border border-white/20 bg-white/[0.01] rounded-full">
            <a href="https://github.com/void-only" onClick={(e) => { e.preventDefault(); window.open("https://github.com/void-only", "_blank"); }} className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"><Github size={16} strokeWidth={1.5} /></a>
            <a href="https://discord.gg/GEUt7TXDqk" onClick={(e) => { e.preventDefault(); window.open("https://discord.gg/GEUt7TXDqk", "_blank"); }} className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
            </a>
            <a href="mailto:vanturestudios.dev@gmail.com" onClick={(e) => { e.preventDefault(); window.location.href = "mailto:vanturestudios.dev@gmail.com"; }} className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"><Mail size={16} strokeWidth={1.5} /></a>
          </div>
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="text-white/30 hover:text-white/80 transition-colors duration-500 cursor-default" title="meow."><Cat size={14} strokeWidth={1.5} /></div>
            <div className="text-white text-[9px] md:text-[10px] tracking-widest uppercase">Crafted with 🤍 by void</div>
          </div>
        </div>
      </footer>

      {/* Guestbook Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-black/80 flex justify-center items-start overflow-y-auto p-4 md:p-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="max-w-2xl w-full relative border border-white/20 bg-[#050505] p-6 md:p-10 rounded-lg mt-10 md:mt-20 mb-20 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-8 flex items-center">
                <MessageSquare size={14} className="mr-3 opacity-40" /> The Guestbook
              </h2>

              {/* Submission Form */}
              {!isLeavingMark ? (
                <button
                  onClick={() => setIsLeavingMark(true)}
                  className="w-full border border-dashed border-white/20 hover:border-white/50 text-white/40 hover:text-white transition-colors duration-300 py-6 rounded text-sm italic font-serif flex items-center justify-center gap-2 mb-10"
                >
                  + leave something behind
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col gap-4 mb-10 border-b border-white/10 pb-8"
                  onSubmit={handleMarkSubmit}
                >
                  <input type="text" placeholder="Name (optional)" value={markName} onChange={(e) => setMarkName(e.target.value)} className="bg-black/50 border border-white/10 rounded px-4 py-2 text-sm text-white/80 focus:outline-none focus:border-white/30 transition-colors w-full md:w-1/2" maxLength={30} />
                  <textarea placeholder="Your message (max 120 chars)" value={markText} onChange={(e) => setMarkText(e.target.value)} className="bg-black/50 border border-white/10 rounded px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30 transition-colors resize-none h-24 w-full" maxLength={120} required />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                      <input type="checkbox" checked={isHuman} onChange={(e) => setIsHuman(e.target.checked)} className="hidden" />
                      <div className={`w-3.5 h-3.5 border ${isHuman ? 'bg-white/50 border-white/50' : 'border-white/30 group-hover:border-white/50'} transition-colors flex items-center justify-center rounded-sm`}>
                        {isHuman && <div className="w-1.5 h-1.5 bg-black rounded-sm" />}
                      </div>
                      <span className="text-white/40 text-[10px] tracking-[0.2em] uppercase mt-0.5 group-hover:text-white/60 transition-colors">I exist.</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-white/30 text-[10px] tracking-widest">{markText.length}/120</span>
                      <button type="submit" disabled={!isHuman || !markText.trim() || isSubmitting} className="border border-white/20 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 rounded px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300">
                        {isSubmitting ? '...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                  {submitStatus && <p className="text-white/50 text-[10px] tracking-widest uppercase mt-2">{submitStatus}</p>}
                </motion.form>
              )}

              {/* Full List of Marks */}
              <div className="flex flex-col gap-8">
                {marks.map((mark, idx) => (
                  <div key={mark.id || idx} className="flex flex-col gap-2 border-l border-white/10 pl-4 md:pl-6 hover:border-white/30 transition-colors">
                    <p className="text-white/80 text-sm md:text-base italic font-serif leading-relaxed">"{mark.message}"</p>
                    <div className="flex items-center gap-2 text-white/40 text-[9px] md:text-[10px] uppercase tracking-widest mt-1">
                      <span className="text-base leading-none mr-1">{getEmoji(mark.name)}</span>
                      <span>{mark.name}</span>
                      <span className="opacity-50">•</span>
                      <span className="opacity-50">{new Date(mark.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
                {marks.length === 0 && <p className="text-white/30 text-xs italic font-serif">It is quiet here.</p>}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}