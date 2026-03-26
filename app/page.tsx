"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import Footer from "@/components/Footer";

const BULLETS = [
  "Results-Driven Full Stack Engineer",
  "4+ years building scalable web & mobile applications with 1M+ users.",
  "Experienced in leading teams, shipping fast, and owning products end-to-end.",
  "Successfully launched multiple apps on iOS & Android platforms."
];

const PROJECT_DETAILS = {
  title: "🚀 CitationBot — Document QA with Verifiable Answers",
  sections: [
    { label: "What it does", content: "Upload documents → get accurate answers with exact citations" },
    { label: "Why it stands out", items: ["✅ Trust-first AI (no hallucinations)", "⚡ Fast RAG + vector search", "🧠 Context-aware (Gemini-powered)"] },
    { label: "Impact", items: ["80%+ faster document search", "Reliable for research & knowledge workflows"] },
    { label: "Tech", items: ["FastAPI, LangChain, Neon DB", "Next.js, Zustand, Vercel", "Cloud Run, Gemini API"] }
  ]
};

export default function Home() {
  const [splashStage, setSplashStage] = useState(0); // 0: Profile, 1: Project, 2: Site
  const [visibleCount, setVisibleCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (splashStage < 2) {
      const startTime = Date.now();
      const duration = splashStage === 0 ? 10000 : 16000;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          setSplashStage(prev => prev + 1);
          setVisibleCount(0);
          setProgress(0);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [splashStage]);

  useEffect(() => {
    const max = splashStage === 0 ? BULLETS.length : PROJECT_DETAILS.sections.length + 1;
    if (splashStage < 2 && visibleCount < max) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [splashStage, visibleCount]);

  if (splashStage < 2) {
    return (
      <div className="min-h-screen w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex items-center justify-center" style={{ padding: '0.5rem' }}>

        {/* STAGE 0: Profile */}
        {splashStage === 0 && (
          <div className="relative h-[75vh] w-[90%] md:w-[60%] lg:w-[50%] bg-white/5 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 rounded-[2.5rem] flex flex-col justify-center items-center transition-all duration-700 group/card animate-in fade-in zoom-in-95" style={{ padding: '1.5rem' }}>
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10 rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="relative h-[25%] sm:h-[30%] min-h-[120px] max-h-[180px] aspect-square rounded-full bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(99,102,241,0.4)] shrink-0 group/avatar" style={{ padding: '0.125rem', marginBottom: '1rem' }}>
              <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-900 border-4 border-slate-900">
                <Image src="/profile.jpeg" alt="Profile" fill className="object-cover transform transition-transform duration-700 group-hover/avatar:scale-110" priority />
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl flex flex-col justify-center overflow-y-auto z-10 custom-scrollbar" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
              <ul style={{ margin: 0, padding: 0 }}>
                {BULLETS.map((bullet, index) => {
                  const isVisible = index < visibleCount;
                  return (
                    <li key={index} className="group flex items-start text-slate-300 transition-all duration-700 hover:text-white" style={{ marginBottom: index !== BULLETS.length - 1 ? '0.75rem' : '0', fontSize: '0.9075rem', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-40px)', visibility: isVisible ? 'visible' : 'hidden' }}>
                      <div className="relative flex items-center justify-center shrink-0" style={{ marginTop: '0.25rem', marginRight: '0.625rem' }}>
                        <span className="absolute h-4 w-4 rounded-full bg-indigo-500/20 group-hover:scale-[1.8] group-hover:bg-purple-500/30 transition-all duration-500"></span>
                        <span className="relative h-2 w-2 rounded-full bg-indigo-400 group-hover:bg-purple-400 transition-colors duration-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"></span>
                      </div>
                      <span className="leading-relaxed tracking-wide font-light">{bullet}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <button
              onClick={() => { setSplashStage(1); setVisibleCount(0); setProgress(0); }}
              className="rounded-full text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/50 transition-all duration-300 font-medium tracking-wider uppercase backdrop-blur-sm z-10 overflow-hidden"
              style={{ 
                marginTop: '1rem', 
                padding: '0.4375rem 1.25rem', 
                fontSize: '0.7865rem',
                background: `linear-gradient(to right, rgba(99, 102, 241, 0.4) ${progress}%, rgba(255, 255, 255, 0.05) ${progress}%)`
              }}
            >
              Learn More
            </button>
          </div>
        )}

        {/* STAGE 1: Project Overview */}
        {splashStage === 1 && (
          <div className="relative h-[85vh] w-[95%] lg:w-[85%] bg-white/5 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 rounded-[3rem] flex flex-col lg:flex-row transition-all duration-700 animate-in fade-in slide-in-from-right-10" style={{ padding: '1.25rem' }}>
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar" style={{ paddingRight: '1.25rem' }}>
              <h1 className="text-white font-bold tracking-tight transition-all duration-700" style={{ fontSize: '1.4rem', marginBottom: '1rem', opacity: visibleCount > 0 ? 1 : 0, transform: visibleCount > 0 ? 'translateY(0)' : 'translateY(20px)' }}>
                {PROJECT_DETAILS.title}
              </h1>
              <div>
                {PROJECT_DETAILS.sections.map((section, idx) => {
                  const isVisible = idx + 1 < visibleCount;
                  return (
                    <div key={idx} className="transition-all duration-700" style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                      visibility: isVisible ? 'visible' : 'hidden',
                      marginBottom: idx !== PROJECT_DETAILS.sections.length - 1 ? '1rem' : '0'
                    }}>
                      <h3 className="text-indigo-400 font-semibold uppercase tracking-widest" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>{section.label}</h3>
                      {section.content && <p className="text-slate-300 font-light leading-relaxed" style={{ fontSize: '0.85rem' }}>{section.content}</p>}
                      {section.items && (
                        <div className="flex flex-wrap" style={{ gap: '0.4rem', marginTop: '0.4rem' }}>
                          {section.items.map((item, i) => (
                            <span key={i} className="rounded-lg border border-white/10 text-slate-300 font-light" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSplashStage(2)}
                className="self-start rounded-full text-indigo-300 hover:text-white border border-indigo-500/30 transition-all duration-300 font-medium tracking-wider uppercase overflow-hidden"
                style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.4rem 1.25rem', 
                  fontSize: '0.75rem', 
                  opacity: visibleCount > PROJECT_DETAILS.sections.length ? 1 : 0,
                  background: `linear-gradient(to right, rgba(99, 102, 241, 0.4) ${progress}%, rgba(99, 102, 241, 0.2) ${progress}%)`
                }}
              >
                Go to App
              </button>
            </div>
            {/* Right Image */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center shadow-inner" style={{ padding: '1.25rem' }}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/img">
                <Image src="/project.png" alt="Project Screenshot" fill className="object-cover transform transition-transform duration-1000 group-hover/img:scale-105" />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent pointer-events-none"></div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Header />
      <MainContent />
      <Footer />
    </>
  );
}
