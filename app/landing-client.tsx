"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './landing.css';

declare global {
  interface Window {
    toggleFaq: (el: HTMLElement) => void;
    showWaitlist: (lang: string) => void;
    submitWaitlist: (lang: string) => void;
  }
}

interface LandingProps {
  isLoggedIn: boolean;
}

export default function LandingClient({ isLoggedIn }: LandingProps) {
  useEffect(() => {

    // ── Progress Bar ─────────────────────────────────
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = pct + '%';
    });

    // ── Nav blur on scroll ───────────────────────────
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // ── Hamburger ────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
      });
      // Close on link click
      mobileMenu.querySelectorAll<HTMLElement>('a').forEach(a => a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }));
    }

    // ── Scroll Reveal ────────────────────────────────
    const reveals = document.querySelectorAll<HTMLElement>('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); revealObs.unobserve(e.target) }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObs.observe(el));

    // ── Hero word animation ──────────────────────────
    const words = document.querySelectorAll<HTMLElement>('#hero-headline .word');
    words.forEach((w, i) => {
      w.style.opacity = '0'; w.style.transform = 'translateY(12px)';
      w.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      w.style.transitionDelay = (i * 0.15) + 's';
      w.style.display = 'inline-block';
      setTimeout(() => { w.style.opacity = '1'; w.style.transform = 'translateY(0)' }, 100);
    });

    // ── Counter animation ────────────────────────────
    const counters = document.querySelectorAll<HTMLElement>('.counter');
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const target = parseInt(el.dataset.target || '0');
          const dur = 1500;
          const start = performance.now();
          const animate = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target).toString();
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(c => counterObs.observe(c));

    // ── Score bars animation ─────────────────────────
    const scoreFills = document.querySelectorAll<HTMLElement>('.score-fill');
    const scoreObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.width = el.dataset.width + '%';
          scoreObs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    scoreFills.forEach(f => scoreObs.observe(f));

    // ── FAQ Accordion ────────────────────────────────
    window.toggleFaq = function (el) {
      const item = el.closest('.faq-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll<HTMLElement>('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    }

    // ── Pricing Toggle ───────────────────────────────
    const toggle = document.getElementById('billing-toggle') as HTMLElement;
    const togMonthly = document.getElementById('tog-monthly') as HTMLElement;
    const togAnnual = document.getElementById('tog-annual') as HTMLElement;
    let isAnnual = false;

    toggle.addEventListener('click', () => {
      isAnnual = !isAnnual;
      toggle.classList.toggle('annual', isAnnual);
      togMonthly.classList.toggle('active', !isAnnual);
      togAnnual.classList.toggle('active', isAnnual);
      document.querySelectorAll<HTMLElement>('.price-switch').forEach(el => {
        const amt = el.querySelector<HTMLElement>('.price-amount');
        const period = el.querySelector<HTMLElement>('.price-period');
        if (amt) amt.textContent = (isAnnual ? el.dataset.annual : el.dataset.monthly) || null;
        if (period) period.textContent = (isAnnual ? period.dataset.annual : period.dataset.monthly) || null;
      });
      document.querySelectorAll<HTMLElement>('.annual-note').forEach(el => {
        el.innerHTML = isAnnual ? (el.dataset.annual || '&nbsp;') : '&nbsp;';
      });
    });
    toggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click() } });

    window.showWaitlist = function (lang) {
      const card = document.getElementById('lang-' + lang) as HTMLElement;
      card.querySelector<HTMLElement>('.waitlist-btn')!.style.display = 'none';
      card.querySelector<HTMLElement>('.lang-form')!.style.display = 'flex';
      card.querySelector<HTMLInputElement>('.lang-form input')?.focus();
    }
    window.submitWaitlist = async function (lang) {
      const card = document.getElementById('lang-' + lang) as HTMLElement;
      const input = card.querySelector<HTMLInputElement>('.lang-form input');
      const email = input?.value || '';
      if (!email || !email.includes('@')) return;

      const btn = card.querySelector<HTMLButtonElement>('.lang-form button');
      if(btn) btn.textContent = '...';
      if(btn) btn.disabled = true;

      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, language: lang }),
        });
        if (res.ok) {
          card.querySelector<HTMLElement>('.lang-form')!.style.display = 'none';
          card.querySelector<HTMLElement>('.lang-success')!.style.display = 'block';
        } else {
          if(btn) btn.textContent = 'Submit';
          if(btn) btn.disabled = false;
          alert('Something went wrong. Please try again.');
        }
      } catch {
        if(btn) btn.textContent = 'Submit';
        if(btn) btn.disabled = false;
        alert('Network error. Please try again.');
      }
    }


    return () => {
      // cleanup would go here ideally
    };
  }, []);

  const toggleFaq = (e: any) => {
    const item = e.currentTarget.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll<HTMLElement>('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  };

  const showWaitlist = (lang: string) => {
    const card = document.getElementById('lang-' + lang) as HTMLElement;
    if (!card) return;
    card.querySelector<HTMLElement>('.waitlist-btn')!.setAttribute('style', 'display:none');
    card.querySelector<HTMLElement>('.lang-form')!.setAttribute('style', 'display:flex');
    (card.querySelector<HTMLElement>('.lang-form input') as HTMLInputElement).focus();
  };

  const submitWaitlist = async (lang: string) => {
    const card = document.getElementById('lang-' + lang) as HTMLElement;
    if (!card) return;
    const input = card.querySelector<HTMLElement>('.lang-form input') as HTMLInputElement;
    const email = input?.value || '';
    if (!email || !email.includes('@')) return;

    // Disable button while submitting
    const btn = card.querySelector<HTMLElement>('.lang-form button') as HTMLButtonElement;
    if(btn) btn.textContent = '...';
    if(btn) btn.disabled = true;

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: lang }),
      });

      if (res.ok) {
        card.querySelector<HTMLElement>('.lang-form')!.setAttribute('style', 'display:none');
        card.querySelector<HTMLElement>('.lang-success')!.setAttribute('style', 'display:block');
      } else {
        if(btn) btn.textContent = 'Submit';
        if(btn) btn.disabled = false;
        alert('Something went wrong. Please try again.');
      }
    } catch {
      if(btn) btn.textContent = 'Submit';
      if(btn) btn.disabled = false;
      alert('Network error. Please try again.');
    }
  };

  return (
    <>

      <div id="progress-bar"></div>

      {/* NAV */}
      <nav className="nav" id="nav" role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <a href="#" className="nav-logo"><span className="diamond">&#9670;</span> Parlova</a>
          <div className="nav-links"><a href="#features">Learn</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#languages">Languages</a></div>

          <div className="nav-actions">
            {isLoggedIn ? (
              <Link href="/home" className="nav-cta">Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="nav-signin">Sign In</Link>
                <Link href="/login?signup=true" className="nav-cta">Start Free</Link>
              </>
            )}
            <div className="hamburger" id="hamburger" role="button" aria-label="Toggle menu" tabIndex={0}><span></span><span></span><span></span></div>
          </div>

        </div>
      </nav>

      <div className="mobile-menu" id="mobile-menu">
        <a href="#features">Learn</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#languages">Languages</a>
        {isLoggedIn ? (
          <Link href="/home" className="nav-cta" style={{ textAlign: 'center', marginTop: '8px' }}>Dashboard</Link>
        ) : (
          <>
            <Link href="/login">Sign In</Link>
            <Link href="/login?signup=true" className="nav-cta" style={{ textAlign: 'center', marginTop: '8px' }}>Start Free</Link>
          </>
        )}
      </div>


      {/* HERO */}
      <section className="hero section" id="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-label">&#9670; AI Language Learning</div>
              <h1 id="hero-headline"><span className="word">Speak</span> <span className="word">Spanish</span><br /><span className="word">like</span> <span className="word">you</span> <span className="word">were</span><br /><span className="word shimmer">born</span> <span className="word">to.</span></h1>
              <p className="hero-sub">The AI conversation coach and immersion library that serious learners have been waiting for. Speak out loud. Read real content. Actually become fluent.</p>
              <div className="hero-buttons">
                <a href="#pricing" className="btn-primary">Start Speaking Free</a>
                <a href="#how" className="btn-secondary">See how it works &#8595;</a>
              </div>
              <p className="hero-proof"><span className="diamond">&#9670;</span> Trusted by 2,000+ learners · No credit card needed</p>
            </div>
            <div className="phone-wrap" aria-label="Parlova app conversation mockup">
              <div className="phone">
                <div className="phone-bar"><span className="phone-pill">&#9749; Café Order</span></div>
                <div className="chat-messages">
                  <div className="chat-msg chat-ai">Hola, ¿qué deseas pedir hoy?</div>
                  <div className="chat-msg chat-user">Quiero un café con leche...</div>
                  <div className="chat-msg chat-ai">¡Perfecto! ¿Grande o pequeño?</div>
                  <div className="typing"><span></span><span></span><span></span></div>
                </div>
                <div className="phone-mic"><div className="mic-btn"><svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" /></svg></div><span>Tap to speak</span></div>
                <div className="phone-score">&#11088; 91/100 · Great session!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="social-bar reveal">
        <div className="social-inner">
          <span className="social-left">Trusted by learners from</span>
          <span className="social-divider"></span>
          <div className="social-logos"><span>Google</span><span>·</span><span>Microsoft</span><span>·</span><span>Deloitte</span><span>·</span><span>Oxford</span><span>·</span><span>MIT</span><span>·</span><span>INSEAD</span></div>
        </div>
      </div>

      {/* PROBLEM */}
      <section className="section" id="problem">
        <div className="container">
          <div className="section-label reveal">THE PROBLEM</div>
          <h2 className="section-headline reveal">You have studied for years.<br />Why can’t you speak yet?</h2>
          <p className="problem-body reveal">Duolingo gives you streaks. Babbel gives you lessons. Anki gives you flashcards. But none of them put you in a real conversation and make you actually open your mouth. That is why you are still not fluent.</p>
          <div className="comparison">
            <div className="compare-card old reveal" style={{ transitionDelay: '0.1s' }}>
              <h3 className="compare-title">The Old Way</h3>
              <div className="compare-list">
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Tap the correct translation</div>
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Complete the lesson streak</div>
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Study grammar rules</div>
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Repeat the same exercises</div>
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Never actually speak</div>
                <div className="compare-item"><span className="icon-bad">&#10007;</span> Plateau after 6 months</div>
              </div>
            </div>
            <div className="compare-card new reveal" style={{ transitionDelay: '0.2s' }}>
              <h3 className="compare-title">The Parlova Way</h3>
              <div className="compare-list">
                <div className="compare-item"><span className="icon-good">&#10003;</span> Speak Spanish out loud</div>
                <div className="compare-item"><span className="icon-good">&#10003;</span> Read real Spanish content</div>
                <div className="compare-item"><span className="icon-good">&#10003;</span> Practice real conversations</div>
                <div className="compare-item"><span className="icon-good">&#10003;</span> Get scored on pronunciation</div>
                <div className="compare-item"><span className="icon-good">&#10003;</span> Build an immersive vocabulary</div>
                <div className="compare-item"><span className="icon-good">&#10003;</span> Actually become fluent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">HOW IT WORKS</div>
          <h2 className="section-headline reveal">Three steps to real fluency</h2>
          <div className="steps">
            <div className="step-card reveal" style={{ transitionDelay: '0.1s' }}>
              <span className="step-num">01</span>
              <div className="step-icon"><svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" /></svg></div>
              <h3 className="step-title">Know your level</h3>
              <p className="step-desc">Take our 10-minute AI diagnostic. Get placed accurately from A1 to C2. Your learning path is built around your exact level from day one.</p>
            </div>
            <div className="step-card reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="step-num">02</span>
              <div className="step-icon"><svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg></div>
              <h3 className="step-title">Practice every day</h3>
              <p className="step-desc">Speak with AI conversation partners in real scenarios. Read Spanish articles, stories, and books. Every word you learn goes into your personal vocabulary deck.</p>
            </div>
            <div className="step-card reveal" style={{ transitionDelay: '0.3s' }}>
              <span className="step-num">03</span>
              <div className="step-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
              <h3 className="step-title">Watch yourself improve</h3>
              <p className="step-desc">See your pronunciation score improve. Watch your vocabulary grow. Earn verified certificates at each CEFR level. Fluency you can prove.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-label reveal">FEATURES</div>
          <h2 className="section-headline reveal">Everything a serious learner needs.<br />Nothing they don’t.</h2>
          <div className="features-grid">
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg></div><h3 className="feature-title">Speak Out Loud</h3><p className="feature-desc">Practice real conversations by speaking Spanish out loud. AI listens, scores your pronunciation, and corrects your grammar.</p><span className="feature-tag">Core Feature</span></div>
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg></div><h3 className="feature-title">Never the Same Twice</h3><p className="feature-desc">8 real-world scenarios with 5 dynamic variations each. The café is always different. The market always surprises you.</p><span className="feature-tag">40 Variations</span></div>
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg></div><h3 className="feature-title">Read Real Spanish</h3><p className="feature-desc">Daily news articles, AI stories calibrated to your level, and classic Spanish literature from Project Gutenberg. Tap any word instantly.</p><span className="feature-tag">Updated Daily</span></div>
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" /><path d="M2 12h20" /></svg></div><h3 className="feature-title">Words That Stick</h3><p className="feature-desc">Every word you encounter gets saved automatically. Spaced repetition reviews ensure you never forget what you learned.</p><span className="feature-tag">Spaced Repetition</span></div>
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 12l3 3 7-7" /></svg></div><h3 className="feature-title">Prove Your Level</h3><p className="feature-desc">Pass our rigorous level tests and earn CEFR-aligned certificates with QR verification. Recognised by employers and universities.</p><span className="feature-tag">Verified</span></div>
            <div className="feature-card reveal"><div className="feature-icon"><svg viewBox="0 0 24 24"><path d="M2 12h4l3-9 6 18 3-9h4" /></svg></div><h3 className="feature-title">Hear Yourself Improve</h3><p className="feature-desc">Real-time speech recognition scores every spoken response. See exactly which words were unclear and track your pronunciation improving over time.</p><span className="feature-tag">AI Powered</span></div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="section demo-section" id="demo">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">SEE IT IN ACTION</div>
          <h2 className="section-headline reveal">A real practice session</h2>
          <div className="laptop reveal">
            <div className="laptop-screen">
              <div className="laptop-sidebar">
                <div className="sidebar-item active">&#9749; Café</div>
                <div className="sidebar-item">&#127978; Market</div>
                <div className="sidebar-item">&#127973; Doctor</div>
                <div className="sidebar-item">&#128188; Interview</div>
              </div>
              <div className="laptop-main">
                <div className="laptop-msg laptop-ai">Bienvenido. ¿Qué le puedo ofrecer?</div>
                <div className="laptop-msg laptop-user">Quiero ordenar un café con leche y un croissant, por favor.<div className="mic-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /></svg> Voice</div></div>
                <div className="laptop-msg laptop-ai">Claro que sí. ¿Lo quiere para aquí o para llevar?</div>
                <div className="laptop-msg laptop-user">Para aquí, gracias.<div className="mic-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /></svg> Voice</div></div>
                <div className="laptop-msg laptop-ai">Perfecto. Son cuatro euros con cincuenta.</div>
                <div className="score-panel" id="score-panel">
                  <div className="score-header"><h4>Session Complete</h4><span className="score-total">&#11088; <span className="counter" data-target="87">0</span>/100</span></div>
                  <div className="score-bars">
                    <div className="score-row"><div className="score-row-label"><span>Grammar</span><span className="score-val counter" data-target="82">0</span></div><div className="score-bar"><div className="score-fill" data-width="82"></div></div></div>
                    <div className="score-row"><div className="score-row-label"><span>Vocabulary</span><span className="score-val counter" data-target="90">0</span></div><div className="score-bar"><div className="score-fill" data-width="90"></div></div></div>
                    <div className="score-row"><div className="score-row-label"><span>Naturalness</span><span className="score-val counter" data-target="85">0</span></div><div className="score-bar"><div className="score-fill" data-width="85"></div></div></div>
                    <div className="score-row"><div className="score-row-label"><span>Pronunciation</span><span className="score-val counter" data-target="91">0</span></div><div className="score-bar"><div className="score-fill" data-width="91"></div></div></div>
                  </div>
                  <div className="score-goal">Goal: &#10003; Completed</div>
                  <div className="score-unclear">Words unclear: “llevar” “croissant”</div>
                </div>
              </div>
            </div>
          </div>
          <div className="stat-callouts reveal">
            <div className="stat-item"><div className="stat-num"><span className="counter" data-target="87">0</span></div><div className="stat-label">avg session score</div></div>
            <div className="stat-item"><div className="stat-num"><span className="counter" data-target="40">0</span></div><div className="stat-label">unique scenarios</div></div>
          </div>
        </div>
      </section>

      {/* IMMERSION LIBRARY */}
      <section className="section" id="library">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">IMMERSION LIBRARY</div>
          <h2 className="section-headline reveal">Spanish everywhere you look</h2>
          <div className="library-grid">
            <div className="library-card reveal">
              <h3>Real Articles</h3>
              <p>Fresh Spanish news daily from BBC Mundo, DW Español, and more. Every word tappable.</p>
              <div className="library-visual">
                <div className="article-preview"><span className="level-badge">B1</span>La inteligencia artificial transforma la educación</div>
                <div className="article-preview"><span className="level-badge">A2</span>Las mejores ciudades para aprender español</div>
              </div>
            </div>
            <div className="library-card reveal">
              <h3>AI Stories</h3>
              <p>Infinite original stories generated at your exact CEFR level on topics you actually enjoy.</p>
              <div className="library-visual">
                <div className="story-chips"><span className="story-chip">Travel</span><span className="story-chip">Food</span><span className="story-chip">Work</span><span className="story-chip">Daily Life</span><span className="story-chip">Adventure</span><span className="story-chip">Culture</span></div>
                <div className="article-preview" style={{ marginTop: '8px' }}><span className="level-badge">A2</span>Un día perfecto en Barcelona...</div>
              </div>
            </div>
            <div className="library-card reveal">
              <h3>Classic Literature</h3>
              <p>Spanish literary classics from Project Gutenberg. Simplified for your level. Read Don Quijote at B1.</p>
              <div className="library-visual">
                <div className="book-spines">
                  <div className="book-spine" style={{ height: '90px', background: 'var(--accent-gold)', opacity: '0.8' }}></div>
                  <div className="book-spine" style={{ height: '100px', background: 'var(--accent-gold-hover)', opacity: '0.6' }}></div>
                  <div className="book-spine" style={{ height: '75px', background: 'var(--accent-gold)', opacity: '0.5' }}></div>
                  <div className="book-spine" style={{ height: '85px', background: 'var(--accent-gold-hover)', opacity: '0.7' }}></div>
                  <div className="book-spine" style={{ height: '95px', background: 'var(--accent-gold)', opacity: '0.4' }}></div>
                </div>
              </div>
            </div>
          </div>
          <p className="library-note reveal">“Every word you tap in any content is automatically saved to your vocabulary deck.”</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">LEARNERS</div>
          <h2 className="section-headline reveal">What serious learners say</h2>
          <div className="testimonials">
            <div className="testimonial-card reveal"><span className="testimonial-quote-mark">“</span><div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p className="testimonial-text">I plateaued at B1 for two years. After 6 weeks of speaking practice on Parlova I finally feel like I am actually progressing.</p><div className="testimonial-name">Marcus T.</div><div className="testimonial-details">Software Engineer · B2 level</div></div>
            <div className="testimonial-card reveal"><span className="testimonial-quote-mark">“</span><div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p className="testimonial-text">The combination of speaking practice and reading real articles is exactly what I needed. No other app does both this well.</p><div className="testimonial-name">Priya S.</div><div className="testimonial-details">MBA Student · B1 level</div></div>
            <div className="testimonial-card reveal"><span className="testimonial-quote-mark">“</span><div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p className="testimonial-text">I was embarrassed to speak Spanish with real people. Now I practice every day without any fear. My confidence is completely different.</p><div className="testimonial-name">James O.</div><div className="testimonial-details">Freelancer · A2 to B1 in 3 months</div></div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">PRICING</div>
          <h2 className="section-headline reveal">Start free. Upgrade when you’re ready.</h2>
          <div className="pricing-toggle reveal">
            <span id="tog-monthly" className="active">Monthly</span>
            <div className="toggle-switch" id="billing-toggle" role="switch" aria-label="Toggle annual billing" tabIndex={0}></div>
            <span id="tog-annual">Annual</span>
            <span className="save-badge">Save 45%</span>
          </div>
          <div className="pricing-cards">
            <div className="pricing-card reveal">
              <div className="pricing-label">Free Forever</div>
              <div className="pricing-price">$0</div>
              <div className="pricing-annual">&nbsp;</div>
              <div className="pricing-sub">No credit card needed</div>
              <div className="pricing-features">
                <div className="pricing-feature"><span className="check">&#10003;</span> 3 AI conversations per week</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> 5 articles per week</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Full beginner pathway</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Vocabulary deck</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Leaderboard access</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Level assessment</div>
              </div>
              <Link href="/login?signup=true" className="pricing-btn ghost">Get Started Free</Link>
            </div>
            <div className="pricing-card featured reveal">
              <div className="pricing-label">Pro <span className="popular-badge">Most Popular</span></div>
              <div className="pricing-price price-switch" data-monthly="$15" data-annual="$99"><span className="price-amount">$15</span><span className="period price-period" data-monthly="/month" data-annual="/year">/month</span></div>
              <div className="pricing-annual annual-note" data-monthly="" data-annual="$99/year · Save 45%">&nbsp;</div>
              <div className="pricing-sub">Everything a serious learner needs</div>
              <div className="pricing-features">
                <div className="pricing-feature"><span className="check">&#10003;</span> Unlimited conversations</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Unlimited articles &amp; stories</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Full book library</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Pronunciation scoring</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Bi-weekly level tests</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Weekly challenges</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> 50% off certificates</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Full analytics</div>
              </div>
              <Link href="/login?signup=true" className="pricing-btn gold">Start 7-Day Free Trial</Link>
            </div>
            <div className="pricing-card reveal">
              <div className="pricing-label">Pro Plus</div>
              <div className="pricing-price price-switch" data-monthly="$29" data-annual="$199"><span className="price-amount">$29</span><span className="period price-period" data-monthly="/month" data-annual="/year">/month</span></div>
              <div className="pricing-annual annual-note" data-monthly="" data-annual="$199/year · Save 43%">&nbsp;</div>
              <div className="pricing-sub">For learners with a real deadline</div>
              <div className="pricing-features">
                <div className="pricing-feature"><span className="check">&#10003;</span> Everything in Pro</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Custom scenario builder</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Real-time conversation coaching</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Unlimited certificates included</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Goal setting with AI study plan</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Weekly personalized report</div>
                <div className="pricing-feature"><span className="check">&#10003;</span> Priority support</div>
              </div>
              <Link href="/login?signup=true" className="pricing-btn ghost">Start 7-Day Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">FAQ</div>
          <h2 className="section-headline reveal">Questions answered</h2>
          <div className="faq-list" style={{ textAlign: 'left' }}>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>Is Parlova actually better than Duolingo?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>Duolingo is great for building a habit and learning basics. Parlova is built for what comes next — actually speaking. If you have been studying for months or years and still cannot hold a conversation, Parlova solves exactly that problem.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>Do I need to know any Spanish to start?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>No. The beginner pathway starts from zero and teaches you everything you need before your first conversation. Complete beginners are fully supported.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>How does the pronunciation scoring work?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>You speak out loud and our AI listens. Your speech is transcribed and scored on clarity and accuracy. You see exactly which words were unclear so you know what to practice.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>What languages does Parlova support?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>Spanish is fully available now. Japanese and Mandarin Chinese are coming soon. Join the waitlist for early access.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>How is this different from a human tutor?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>A human tutor costs $30 to $80 per hour and is available a few hours per week. Parlova costs $15 per month and is available every day at any time. For daily practice Parlova is more effective than weekly tutor sessions because consistency beats intensity.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>What is the 7-day free trial?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>Sign up for Pro or Pro Plus and use everything completely free for 7 days. No credit card required. If you love it your card is charged at day 7. If not cancel with one click.</p></div></div>
            <div className="faq-item reveal"><div className="faq-q" onClick={(e) => toggleFaq(e)}><h4>Can I use Parlova on my phone?</h4><svg className="faq-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div><div className="faq-a"><p>Yes. Parlova works on all modern browsers on iPhone, Android, and desktop. A dedicated mobile app is coming soon.</p></div></div>
          </div>
        </div>
      </section>

      {/* LANGUAGES WAITLIST */}
      <section className="section" id="languages">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-label reveal">COMING SOON</div>
          <h2 className="section-headline reveal">Which language are you learning next?</h2>
          <div className="lang-grid">
            <div className="lang-card reveal" id="lang-ja"><div className="lang-flag">&#127471;&#127477;</div><div className="lang-name">Japanese</div><button className="waitlist-btn" onClick={() => showWaitlist("ja")}>Join Waitlist</button><div className="lang-form" style={{ display: 'none' }}><input type="email" placeholder="your@email.com" /><button onClick={() => submitWaitlist("ja")}>Submit</button></div><div className="lang-success" style={{ display: 'none' }}>&#10003; You’re on the list</div></div>
            <div className="lang-card reveal" id="lang-zh"><div className="lang-flag">&#127464;&#127475;</div><div className="lang-name">Mandarin Chinese</div><button className="waitlist-btn" onClick={() => showWaitlist("zh")}>Join Waitlist</button><div className="lang-form" style={{ display: 'none' }}><input type="email" placeholder="your@email.com" /><button onClick={() => submitWaitlist("zh")}>Submit</button></div><div className="lang-success" style={{ display: 'none' }}>&#10003; You’re on the list</div></div>
            <div className="lang-card reveal" id="lang-fr"><div className="lang-flag">&#127467;&#127479;</div><div className="lang-name">French</div><button className="waitlist-btn" onClick={() => showWaitlist("fr")}>Join Waitlist</button><div className="lang-form" style={{ display: 'none' }}><input type="email" placeholder="your@email.com" /><button onClick={() => submitWaitlist("fr")}>Submit</button></div><div className="lang-success" style={{ display: 'none' }}>&#10003; You’re on the list</div></div>
            <div className="lang-card reveal" id="lang-de"><div className="lang-flag">&#127465;&#127466;</div><div className="lang-name">German</div><button className="waitlist-btn" onClick={() => showWaitlist("de")}>Join Waitlist</button><div className="lang-form" style={{ display: 'none' }}><input type="email" placeholder="your@email.com" /><button onClick={() => submitWaitlist("de")}>Submit</button></div><div className="lang-success" style={{ display: 'none' }}>&#10003; You’re on the list</div></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section final-cta">
        <div className="container">
          <div className="cta-lines reveal"><span></span><span></span><span></span></div>
          <h2 className="reveal">Ready to actually<br />speak Spanish?</h2>
          <p className="sub reveal">Join 2,000+ learners who chose real practice over endless lessons. Start free today.</p>
          <div className="buttons reveal">
            <a href="#pricing" className="btn-primary" style={{ fontSize: '17px', padding: '16px 36px' }}>Start Speaking Free</a>
            <a href="#pricing" className="btn-secondary">See Pricing</a>
          </div>
          <p className="small-note reveal"><span style={{ color: 'var(--accent-primary)' }}>&#9670;</span> No credit card · Cancel anytime · Free forever plan</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo"><span className="diamond">&#9670;</span> Parlova</div>
              <div className="tagline">Speak. Read. Become Fluent.</div>
              <div className="copy">© 2026 Parlova. All rights reserved.</div>
            </div>
            <div className="footer-col"><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#how">How it Works</a><a href="#pricing">Free Trial</a><a href="#">Certificates</a></div>
            <div className="footer-col"><h4>Languages</h4><a href="#">Spanish (Available)</a><a href="#languages" className="coming">Japanese (Coming Soon)</a><a href="#languages" className="coming">Mandarin (Coming Soon)</a><a href="#languages" className="coming">French (Coming Soon)</a><a href="#languages" className="coming">German (Coming Soon)</a></div>
            <div className="footer-col"><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Contact</a></div>
          </div>
          <div className="footer-bottom">
            <p>Made with care for language learners everywhere</p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg></a>
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></a>
            </div>
          </div>
        </div>
      </footer>



    </>
  );
}
// Additional polyfills for local IDE TS server
export {}
