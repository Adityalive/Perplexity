import { useNavigate } from 'react-router-dom';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { useEffect } from 'react';
import './LandingPage.css';
import HolosLogo from '../../components/HolosLogo';

const FEATURES = [
  {
    col: 'lp-feat-col-6',
    img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80',
    alt: 'AI Chat Interface',
    badge: 'POWERED BY GEMINI',
    title: 'DEEP AI CHAT',
    sub: 'Conversational Intelligence',
    desc: 'Experience absolute clarity. Engage with LLMs that understand context, nuance, and intent, providing high-fidelity responses for any complexity.',
  },
  {
    col: 'lp-feat-col-6',
    img: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=800&q=80',
    alt: 'Deep Research',
    badge: '5 PARALLEL SEARCHES',
    title: 'DEEP RESEARCH',
    sub: 'Tavily + Mistral Synthesis',
    desc: 'Go beyond traditional search. Synthesize information from across the global web with multi-step reasoning and automated citation gathering.',
  },
  {
    col: 'lp-feat-col-6',
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    alt: 'Music',
    badge: 'YT MUSIC SYNC',
    title: 'AI MUSIC',
    sub: 'Personalized Playlists',
    desc: 'Your sonic companion. Seamlessly sync with your existing library and let AI curate perfectly matched soundscapes for focus, energy, or deep work.',
  },
  {
    col: 'lp-feat-col-6',
    img: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&q=80',
    alt: 'Image Generation',
    badge: 'POLLINATIONS AI',
    title: 'IMAGE GENERATION',
    sub: 'Text to Visual Reality',
    desc: 'Prompt to visual perfection. Transform abstract ideas into high-resolution digital assets using industry-leading latent diffusion models.',
  },
];

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <>
      {/* ── Global Background Video ── */}
      <video className="lp-global-video" autoPlay loop muted playsInline>
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4"
          type="video/mp4"
        />
      </video>
      <div className="lp-global-overlay" />

      {/* ── TopAppBar ── */}
      <header className="lp-header">
        <div className="lp-logo">
          <HolosLogo size={24} className="lp-logo-img" />
          <span className="lp-logo-text barlow-light">HOLOS</span>
        </div>

        <nav className="lp-nav">
          <a href="#features" className="active barlow-medium">FEATURES</a>
          <a href="#about" className="barlow-medium">ABOUT</a>
          <a href="#contact" className="barlow-medium">CONTACT</a>
        </nav>

        <SignInButton mode="redirect" redirectUrl="/dashboard">
          <button className="lp-cta-btn barlow-medium">Sign In</button>
        </SignInButton>
      </header>

      {/* ── Hero ── */}
      <main className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-headline">
            <div className="corner-accent" style={{ top: 0, left: 0, marginLeft: '-16px', marginTop: '-16px' }} />
            <div className="corner-accent" style={{ bottom: 0, right: 0, marginRight: '-16px', marginBottom: '-16px' }} />
            <h1 className="lp-headline-text barlow-light">
              BUILT FOR THE<br />
              <em>curious</em><br />
              MIND
            </h1>
          </div>

          <div className="lp-cta-cluster">
            <div className="lp-btn-primary-wrap">
              <div className="corner-accent" style={{ top: 0, left: 0, marginLeft: '-4px', marginTop: '-4px' }} />
              <div className="corner-accent" style={{ bottom: 0, right: 0, marginRight: '-4px', marginBottom: '-4px' }} />
              <SignInButton mode="redirect" redirectUrl="/dashboard">
                <button className="lp-btn-primary barlow-medium">
                  Get Started
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </button>
              </SignInButton>
            </div>

            <button
              className="lp-btn-secondary barlow-medium"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Features
            </button>
          </div>
        </div>

        <div className="lp-scroll-indicator">
          <span className="lp-scroll-text barlow-medium">Scroll to Explore</span>
          <div className="lp-scroll-line" />
        </div>
      </main>

      {/* ── Features Section ── */}
      <section id="features" className="lp-features">
        {/* Section Header */}
        <header className="lp-feat-header">
          <div className="lp-feat-header-rule">
            <div className="lp-feat-rule-line" />
            <span className="lp-feat-rule-label barlow-medium">Capabilities Archive</span>
          </div>
          <h2 className="lp-feat-title barlow-light">
            SELECTED <br />
            <em className="serif-italic">features.</em>
          </h2>
        </header>

        {/* Vertical List of Features with descriptive text on the empty side */}
        <div className="lp-feat-list">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feat-row">
              {/* Image Side (Left) */}
              <div className="lp-feat-card lp-feat-col-6">
                <div className="corner-accent" style={{ top: '-4px', left: '-4px' }} />
                <div className="corner-accent" style={{ bottom: '-4px', right: '-4px' }} />
                <div className="lp-feat-img-wrap lp-feat-aspect-wide">
                  <img src={f.img} alt={f.alt} className="lp-feat-img" loading="lazy" />
                  <div className="lp-feat-img-gradient" />
                  <div className="lp-feat-badge barlow-medium">{f.badge}</div>
                </div>
              </div>

              {/* Text Side (Right) */}
              <div className="lp-feat-text-block lp-feat-col-6">
                <h3 className="lp-feat-name barlow-light">{f.title}</h3>
                <p className="lp-feat-sub barlow-medium">{f.sub}</p>
                <div className="lp-feat-desc-wrap">
                  <div className="lp-feat-desc-line" />
                  <p className="lp-feat-description barlow-light">
                    {f.desc}
                  </p>
                </div>
                <div className="lp-feat-action barlow-medium">
                  <span className="material-symbols-outlined lp-feat-arrow">arrow_outward</span>
                  EXPLORE MODULE
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Block */}
        <div className="lp-feat-cta">
          <div className="lp-feat-cta-inner">
            <div className="corner-accent" style={{ top: '-4px', left: '-4px' }} />
            <div className="corner-accent" style={{ bottom: '-4px', right: '-4px' }} />
            <SignInButton mode="redirect" redirectUrl="/dashboard">
              <button className="lp-feat-cta-btn barlow-medium">START EXPLORING</button>
            </SignInButton>
          </div>
          <p className="lp-feat-cta-sub serif-italic">
            Your intelligence, amplified by <span className="lp-feat-cta-highlight">every interaction.</span>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-page-footer">
        <div className="lp-page-footer-left">
          <div className="lp-page-footer-brand serif-italic">HOLOS</div>
          <div className="lp-page-footer-copy barlow-medium">© 2025 HOLOS AI. ALL RIGHTS RESERVED.</div>
        </div>
        <div className="lp-page-footer-links">
          <a href="#" className="barlow-medium">Instagram</a>
          <a href="#" className="barlow-medium">Twitter</a>
          <a href="#" className="barlow-medium">LinkedIn</a>
          <a href="#" className="barlow-medium">Privacy</a>
        </div>
      </footer>
    </>
  );
}


