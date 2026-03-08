import React, { useState, useEffect } from 'react';
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from 'framer-motion';
import { Github, Heart, X, Terminal, Cat, User, MapPin, Mail, MessageSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// These will pull from your .env.local file once deployed
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- 1. Hardware / Board Details ---
// Subtle hollow "stamped nails" for the corners of the boxes
const BoxNails = () => (
  <>
    <div className="absolute top-3 left-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute top-3 right-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
    <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border border-white/20 rounded-full pointer-events-none" />
  </>
);

// --- Quotes Data ---
const quotes = [
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "The quieter you become, the more you are able to hear.", author: "Rumi" },
  { text: "Smooth seas do not make skillful sailors.", author: "African Proverb" },
  { text: "To even have a chance of success, you must be willing to fail.", author: "Unknown" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "The obstacle in the path becomes the path.", author: "Marcus Aurelius" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "The present moment is all you ever have.", author: "Eckhart Tolle" },
  { text: "Do not let the behavior of others destroy your inner peace.", author: "Dalai Lama" },
  { text: "Silence is a source of great strength.", author: "Lao Tzu" }
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
  const [isLeavingMark, setIsLeavingMark] = useState(false);
  const [markName, setMarkName] = useState('');
  const [markText, setMarkText] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Fetch Marks on Load
  useEffect(() => {
    const fetchMarks = async () => {
      if (!supabase) {
        // Fallback for preview environment before DB is connected
        setMarks([
          { id: 1, name: "wanderer", message: "Found this place by accident. It's quiet here.", created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 2, name: "anonymous", message: "Leaving a footprint in the digital dust.", created_at: new Date(Date.now() - 3600000).toISOString() }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('marks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Keep it to the 50 most recent marks

      if (!error && data) setMarks(data);
    };

    fetchMarks();
  }, []);

  // Submit Mark Handler
  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    if (!isHuman || !markText.trim() || isSubmitting) return;

    // Basic Local Rate Limiting (1 mark per hour per browser)
    const lastMarkTime = localStorage.getItem('void_last_mark');
    if (lastMarkTime && Date.now() - parseInt(lastMarkTime) < 3600000) {
      setSubmitStatus("You have already left a mark recently. Let the dust settle.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    const newMark = {
      name: markName.trim() || 'anonymous',
      message: markText.trim(),
    };

    if (supabase) {
      const { error } = await supabase.from('marks').insert([newMark]);
      if (error) {
        setSubmitStatus("Failed to leave mark. The void rejected it.");
        setIsSubmitting(false);
        return;
      }
    }

    // Success
    localStorage.setItem('void_last_mark', Date.now().toString());

    // Update local state to show immediately
    setMarks([{ ...newMark, created_at: new Date().toISOString(), id: Date.now() }, ...marks]);

    setIsSubmitting(false);
    setIsLeavingMark(false);
    setMarkText('');
    setMarkName('');
    setIsHuman(false);
  };

  // Scroll Tracking for Header Collapse & Reminder Deletion
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Collapse header if scrolled down even a bit (20px)
    setIsScrolled(latest > 20);

    // If they scroll while the reminder is visible, retract it immediately
    if (latest > 20 && showReminder) {
      setShowReminder(false);
    }
  });

  // Clock Synchronization
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Title Typing Effect - Increased typing speed
  useEffect(() => {
    const interval = setInterval(() => {
      setTypedChars(prev => {
        if (prev >= fullLength) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 40); 

    return () => clearInterval(interval);
  }, [fullLength]);

  // Quote Rotation Timer
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);

    return () => clearInterval(quoteInterval);
  }, []);

  // Dropping Reminder Effect
  useEffect(() => {
    setReminder(reminders[Math.floor(Math.random() * reminders.length)]);
    const showTimeout = setTimeout(() => setShowReminder(true), 2000);
    const hideTimeout = setTimeout(() => setShowReminder(false), 8000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe Time Formatting (Locked to IST)
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { 
    timeZone: 'Asia/Kolkata', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  const timeParts = timeFormatter.formatToParts(time);
  const hours = timeParts.find(p => p.type === 'hour')?.value || '00';
  const minutes = timeParts.find(p => p.type === 'minute')?.value || '00';

  return (
    <div className="min-h-[200vh] flex flex-col bg-black font-mono text-white selection:bg-white selection:text-black relative overflow-hidden">

      {/* Custom Scrollbar Styles for the Void */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        * { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.15) #000; }
      `}</style>

      {/* Header */}
      <header 
        className="fixed top-0 left-0 w-full py-3 px-6 z-50 flex items-center justify-between cursor-pointer text-sm md:text-base bg-black/40 backdrop-blur-md"
        onClick={scrollToTop}
        title="Return to origin"
      >
        <div className="flex items-center">

          {/* Prefix collapses on scroll */}
          <motion.div 
            animate={{ 
              width: isScrolled ? 0 : "auto", 
              opacity: isScrolled ? 0 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="pointer-events-none text-white/50 overflow-hidden whitespace-nowrap flex pr-2"
          >
            {prefix.split('').map((char, i) => {
              if (i >= typedChars) return null;
              return <span key={i} style={{ whiteSpace: "pre" }}>{char}</span>;
            })}
          </motion.div>

          {/* Suffix stays anchored */}
          <span 
            className="text-white font-semibold flex" 
            style={{ 
              textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 25px rgba(255,255,255,0.5), 0 0 35px rgba(255,255,255,0.3)' 
            }}
          >
            {suffix.split('').map((char, i) => {
              const globalIndex = prefix.length + i;
              if (globalIndex >= typedChars) return null;
              return <span key={i} style={{ whiteSpace: "pre" }}>{char}</span>;
            })}
          </span>
        </div>

        {/* Right Section: Clock & Reminder */}
        <div className="flex flex-col items-end relative">

          {/* Compact Top Right Clock with Location Pin */}
          <div className="text-white/50 text-xs pointer-events-none flex items-center">
            <MapPin size={12} className="mr-1.5 opacity-70" strokeWidth={2} />
            <span>{hours}</span>
            <span className="mx-[2px]" style={{ opacity: time.getSeconds() % 2 === 0 ? 1 : 0 }}>:</span>
            <span>{minutes}</span>
          </div>

          {/* Dropping Reminder - Simple text behind glass header */}
          <AnimatePresence>
            {showReminder && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute top-full pt-3 flex flex-col items-end pointer-events-none right-0 md:right-1 -z-10"
              >
                <div className="text-white/50 text-[9px] md:text-[10px] tracking-widest font-mono whitespace-nowrap">
                  {reminder}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </header>

      {/* Main Void Space */}
      <main className="flex-1 pt-32 md:pt-40 px-6 w-full relative z-10 flex justify-center">
        {/* Slightly tighter gap to pull the merged boards closer */}
        <div className="max-w-3xl w-full pb-32 flex flex-col gap-6 md:gap-8">

          <div className="relative border border-white/20 p-8 md:p-12 rounded-lg">
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
          </div>

          {/* Merged Likes and Dislikes Board */}
          <div className="relative border border-white/20 p-8 md:p-12 rounded-lg">
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
          </div>

          <div className="relative border border-white/20 p-8 md:p-12 rounded-lg">
            <BoxNails />

            <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
              <Terminal size={14} className="mr-3 opacity-40" /> Currently
            </h2>
            <p className="text-white/70 text-sm md:text-base italic font-serif">
              Trying to get a little better at things every day.
            </p>
          </div>

          {/* Leave a Mark Section */}
          <div className="relative border border-white/20 p-8 md:p-12 rounded-lg">
            <BoxNails />

            <h2 className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 flex items-center">
              <MessageSquare size={14} className="mr-3 opacity-40" /> Leave a Mark
            </h2>

            {!isLeavingMark ? (
              <button
                onClick={() => setIsLeavingMark(true)}
                className="text-white/40 text-sm hover:text-white transition-colors duration-300 flex items-center italic font-serif"
              >
                + leave something behind
              </button>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 mb-10 border-b border-white/10 pb-8"
                onSubmit={handleMarkSubmit}
              >
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={markName}
                  onChange={(e) => setMarkName(e.target.value)}
                  className="bg-transparent border border-white/10 rounded px-4 py-2 text-sm text-white/80 focus:outline-none focus:border-white/30 transition-colors w-full md:w-1/2"
                  maxLength={30}
                />
                <textarea
                  placeholder="Your message (max 120 chars)"
                  value={markText}
                  onChange={(e) => setMarkText(e.target.value)}
                  className="bg-transparent border border-white/10 rounded px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-white/30 transition-colors resize-none h-24 w-full"
                  maxLength={120}
                  required
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <input
                      type="checkbox"
                      checked={isHuman}
                      onChange={(e) => setIsHuman(e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-3.5 h-3.5 border ${isHuman ? 'bg-white/50 border-white/50' : 'border-white/30 group-hover:border-white/50'} transition-colors flex items-center justify-center rounded-sm`}>
                      {isHuman && <div className="w-1.5 h-1.5 bg-black rounded-sm" />}
                    </div>
                    <span className="text-white/40 text-[10px] tracking-[0.2em] uppercase mt-0.5 group-hover:text-white/60 transition-colors">I exist.</span>
                  </label>

                  <div className="flex items-center gap-4">
                    <span className="text-white/30 text-[10px] tracking-widest">{markText.length}/120</span>
                    <button
                      type="submit"
                      disabled={!isHuman || !markText.trim() || isSubmitting}
                      className="border border-white/20 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 rounded px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                    >
                      {isSubmitting ? '...' : 'Submit'}
                    </button>
                  </div>
                </div>
                {submitStatus && <p className="text-white/50 text-[10px] tracking-widest uppercase mt-2">{submitStatus}</p>}
              </motion.form>
            )}

            {/* The Wall of Marks */}
            <div className="mt-8 flex flex-col gap-8">
              {marks.map((mark, idx) => (
                <div key={mark.id || idx} className="flex flex-col gap-2 border-l border-white/10 pl-4 md:pl-6">
                  <p className="text-white/70 text-sm md:text-base italic font-serif">"{mark.message}"</p>
                  <div className="flex items-center gap-2 text-white/30 text-[9px] md:text-[10px] uppercase tracking-widest">
                    <span>{mark.name}</span>
                    <span>•</span>
                    <span>{new Date(mark.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
              {marks.length === 0 && (
                <p className="text-white/30 text-xs italic font-serif">It is quiet here.</p>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-end pb-4 px-6 relative z-10">

        {/* Board-style Quote Box with matching nails */}
        <div className="w-full max-w-2xl relative border border-white/20 rounded-lg flex items-center justify-center min-h-[140px]">
          <BoxNails />

          <AnimatePresence>
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="flex flex-col gap-2 w-full absolute px-8 md:px-12"
            >
              <p className="text-center italic text-white/70 text-xs md:text-sm leading-relaxed">
                <span className="font-serif text-white/60 mr-1">“</span>
                {quotes[quoteIndex].text}
                <span className="font-serif text-white/60 ml-1">”</span>
              </p>
              <span className="text-right text-white/40 text-[10px] md:text-xs tracking-tight mt-1">
                — {quotes[quoteIndex].author}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          {/* Hollow Capsule with Links */}
          <div className="flex items-center gap-8 px-8 py-3 border border-white/20 rounded-full">
            <a 
              href="[https://github.com/void-only](https://github.com/void-only)" 
              onClick={(e) => {
                e.preventDefault();
                window.open("[https://github.com/void-only](https://github.com/void-only)", "_blank", "noopener,noreferrer");
              }}
              className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer" 
              title="GitHub"
            >
              <Github size={16} strokeWidth={1.5} />
            </a>
            <a 
              href="[https://discord.gg/GEUt7TXDqk](https://discord.gg/GEUt7TXDqk)" 
              onClick={(e) => {
                e.preventDefault();
                window.open("[https://discord.gg/GEUt7TXDqk](https://discord.gg/GEUt7TXDqk)", "_blank", "noopener,noreferrer");
              }}
              className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer" 
              title="Discord"
            >
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
            </a>
            <a 
              href="mailto:vanturestudios.dev@gmail.com" 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "mailto:vanturestudios.dev@gmail.com";
              }}
              className="text-white/30 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer" 
              title="Email"
            >
              <Mail size={16} strokeWidth={1.5} />
            </a>
          </div>

          {/* Symmetrical Signature Area */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="text-white/30 hover:text-white/80 transition-colors duration-500 cursor-default" title="meow.">
              <Cat size={14} strokeWidth={1.5} />
            </div>
            <div className="text-white text-[9px] md:text-[10px] tracking-widest uppercase">
              Crafted with 🤍 by void
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}