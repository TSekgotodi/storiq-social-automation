import { useEffect, useRef, useState } from "react";
import {
  N8nConnectionError,
  N8nWebhookResponseError,
  triggerN8nWorkflow,
  type N8nWorkflowPayload,
  type PlatformType,
} from "./lib/n8n";
import {
  authClient,
  consumeSocialLoginError,
  getPlanLabel,
  getSocialUserProfile,
  loginWithBackend,
  registerWithBackend,
  signInWithSocialProvider,
  type BackendSession,
  type UserProfile,
} from "./lib/auth";
import UserProfileMenu from "./components/UserProfileMenu";
import { cropImageToAspectRatio } from "./lib/media";
import reigndevLogo from "./assets/reigndev-logo.png?inline";

type IconName =
  | "sparkles"
  | "home"
  | "calendar"
  | "library"
  | "analytics"
  | "workflow"
  | "settings"
  | "bell"
  | "plus"
  | "image"
  | "video"
  | "chevron"
  | "wand"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "check"
  | "clock"
  | "send"
  | "play"
  | "more"
  | "zap"
  | "upload"
  | "x"
  | "facebook"
  | "heart"
  | "comment"
  | "bookmark"
  | "repeat"
  | "search"
  | "google";

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    sparkles: (
      <>
        <path d="m12 3-1.4 3.6a6 6 0 0 1-3.4 3.4L3.5 12l3.7 1.5a6 6 0 0 1 3.4 3.4L12 20.5l1.5-3.6a6 6 0 0 1 3.4-3.4l3.6-1.5-3.6-1.5a6 6 0 0 1-3.4-3.4L12 3Z" />
        <path d="m5 3 .5 1.2A2 2 0 0 0 6.7 5.5L8 6l-1.3.5a2 2 0 0 0-1.2 1.2L5 9l-.5-1.3a2 2 0 0 0-1.2-1.2L2 6l1.3-.5a2 2 0 0 0 1.2-1.3L5 3Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    library: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
        <circle cx="16.5" cy="8.5" r="1.5" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
      </>
    ),
    workflow: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="2" />
        <rect x="15" y="15" width="6" height="6" rx="2" />
        <path d="M9 6h3a4 4 0 0 1 4 4v5M15 18h-3a4 4 0 0 1-4-4V9" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m3 17 5-5 4 4 3-3 6 6" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="3" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    wand: (
      <>
        <path d="m15 4 5 5L8 21H3v-5L15 4Z" />
        <path d="m12 7 5 5M6 3v3M4.5 4.5h3M19 16v4M17 18h4" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r=".7" fill="currentColor" stroke="none" />
      </>
    ),
    tiktok: (
      <>
        <path d="M15 3v11.2a4.8 4.8 0 1 1-4-4.7" />
        <path d="M15 3c.8 3.2 2.7 4.8 5 5" />
      </>
    ),
    youtube: (
      <>
        <path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.5 12 5.5 12 5.5s-5 0-6.9.6A3 3 0 0 0 3 8.2 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.6 6.9.6 6.9.6s5 0 6.9-.6a3 3 0 0 0 2.1-2.1 31 31 0 0 0 0-7.6Z" />
        <path d="m10 9 5 3-5 3V9Z" />
      </>
    ),
    linkedin: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 10v7M8 7v.1M12 17v-7m0 3a3 3 0 0 1 6 0v4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
    facebook: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 8H13a2 2 0 0 0-2 2v11M8 13h7" />
      </>
    ),
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    repeat: (
      <>
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" />
        <path d="M21 13v2a3 3 0 0 1-3 3H3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    google: (
      <>
        <path d="M21 12.2c0-.7-.1-1.4-.2-2H12v3.7h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7Z" />
        <path d="M12 21.3c2.6 0 4.8-.9 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.7-1.7-5.5-4h-3.2V16c1.6 3.1 4.9 5.3 8.7 5.3Z" />
        <path d="M6.5 13.5a5.6 5.6 0 0 1 0-3V8H3.3a9.3 9.3 0 0 0 0 8l3.2-2.5Z" />
        <path d="M12 6.5c1.4 0 2.7.5 3.7 1.4l2.8-2.7A9.3 9.3 0 0 0 3.3 8l3.2 2.5c.8-2.3 3-4 5.5-4Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

const platforms = [
  { name: "Instagram", icon: "instagram" as IconName, color: "pink" },
  { name: "Facebook", icon: "facebook" as IconName, color: "blue" },
  { name: "TikTok", icon: "tiktok" as IconName, color: "cyan" },
  { name: "X", icon: "x" as IconName, color: "neutral" },
];

const navItems = [
  { label: "Create", icon: "sparkles" as IconName },
  { label: "Calendar", icon: "calendar" as IconName },
  { label: "Content Library", icon: "library" as IconName },
];

const today = new Date().toISOString().slice(0, 10);
const platformIdentifiers: Record<string, PlatformType> = {
  Instagram: "instagram",
  Facebook: "facebook",
  TikTok: "tiktok",
  X: "x",
};

function futureDate(daysAhead: number) {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

function zonedDateTimeToIso(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(utcGuess))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const offset =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - utcGuess;

  return new Date(utcGuess - offset).toISOString();
}

const creatorPhoto =
  "https://images.unsplash.com/photo-1653287805993-9a1a7ea28c20?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200";

function EntryBrand() {
  return (
    <div className="entry-brand">
      <span><Icon name="sparkles" size={21} /></span>
      <strong>Storiq</strong>
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="splash-screen">
      <div className="splash-glow one" />
      <div className="splash-glow two" />
      <div className="splash-content">
        <div className="splash-mark"><Icon name="sparkles" size={36} /></div>
        <div className="splash-word">Storiq</div>
        <p>Create once. Show up everywhere.</p>
        <span className="splash-loader"><i /></span>
      </div>
      <div className="splash-powered">POWERED BY REIGNDEV</div>
    </main>
  );
}

function LandingPage({
  onLogin,
  onDemo,
  onPricing,
}: {
  onLogin: () => void;
  onDemo: () => void;
  onPricing: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <EntryBrand />
        <div className={`landing-nav-links${isMobileMenuOpen ? " is-open" : ""}`}>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
          <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)}>Benefits</a>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onPricing();
            }}
            type="button"
          >
            Pricing
          </button>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-signin" onClick={onLogin} type="button">Sign in</button>
          <button className="landing-primary small" onClick={onLogin} type="button">
            Start creating <Icon name="send" size={14} />
          </button>
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="landing-mobile-menu"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-pill"><span /> YOUR CONTENT, IN MOTION</div>
          <h1>Create once.<br /><em>Show up everywhere.</em></h1>
          <p>
            Upload, preview, schedule, and publish scroll-stopping content across every
            social channel—from one beautifully simple workspace.
          </p>
          <div className="hero-actions">
            <button className="landing-primary" onClick={onLogin} type="button">
              Start creating now <Icon name="send" size={16} />
            </button>
            <button className="landing-secondary" onClick={onDemo} type="button">
              <span><Icon name="play" size={15} /></span> Explore the studio
            </button>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><i>JD</i><i>KM</i><i>SL</i><i>+</i></div>
            <div><strong>Built for modern creators</strong><span>One workflow. Every platform.</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-photo">
            <img
              alt="Content creator filming with a camera in a studio"
              src={creatorPhoto}
            />
            <div className="hero-photo-gradient" />
            <div className="hero-photo-copy">
              <span>READY TO PUBLISH</span>
              <strong>Make your next<br />story impossible<br />to ignore.</strong>
            </div>
          </div>
          <div className="floating-card platforms-card">
            <small>PUBLISHING TO</small>
            <div>
              {platforms.map((platform) => (
                <span className={platform.color} key={platform.name}>
                  <Icon name={platform.icon} size={15} />
                </span>
              ))}
            </div>
          </div>
          <div className="floating-card scheduled-card">
            <span><Icon name="check" size={15} /></span>
            <div><strong>Content scheduled</strong><small>4 channels · 09:30 AM</small></div>
          </div>
          <a
            className="photo-credit"
            href="https://unsplash.com/@alex_gruber"
            rel="noreferrer"
            target="_blank"
          >
            Photo by Alex Gruber
          </a>
        </div>
      </section>

      <section className="landing-platform-strip">
        <span>YOUR STORY, EVERYWHERE</span>
        {platforms.map((platform) => (
          <div key={platform.name}><Icon name={platform.icon} size={18} /> {platform.name}</div>
        ))}
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <span>EVERYTHING IN ONE PLACE</span>
          <h2>Your entire content workflow,<br />finally in flow.</h2>
          <p>Less switching. Less second-guessing. More time to create what matters.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card featured">
            <span className="feature-icon"><Icon name="image" /></span>
            <div>
              <small>CREATE</small>
              <h3>Upload without limits</h3>
              <p>Bring images and videos from your phone into one organized content queue.</p>
            </div>
            <div className="feature-mini-stack"><i /><i /><i /></div>
          </article>
          <article className="feature-card">
            <span className="feature-icon cyan"><Icon name="instagram" /></span>
            <small>PREVIEW</small>
            <h3>See it before they do</h3>
            <p>Preview every post inside authentic Instagram, Facebook, TikTok, and X layouts.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon green"><Icon name="calendar" /></span>
            <small>PLAN</small>
            <h3>Schedule with confidence</h3>
            <p>Give every content item its own date, time, caption, hashtags, and destination.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon orange"><Icon name="workflow" /></span>
            <small>AUTOMATE</small>
            <h3>Publish while you create</h3>
            <p>Reigndev-powered workflows move approved content to every selected channel.</p>
          </article>
        </div>
      </section>

      <section className="landing-workflow" id="workflow">
        <div className="workflow-copy">
          <span>FROM CAMERA ROLL TO EVERY FEED</span>
          <h2>Four steps. Zero chaos.</h2>
          <div className="workflow-steps">
            {[
              ["01", "Upload your content", "Choose one or many images and videos from any device."],
              ["02", "Make every post yours", "Add unique captions, hashtags, styles, and formats."],
              ["03", "Preview every platform", "Review the real-world look before anything goes live."],
              ["04", "Schedule or publish", "Choose the right moment, then let Storiq handle the rest."],
            ].map(([number, title, description]) => (
              <div key={number}><i>{number}</i><span><strong>{title}</strong><small>{description}</small></span></div>
            ))}
          </div>
        </div>
        <div className="workflow-panel">
          <div className="workflow-panel-top"><EntryBrand /><span>LIVE WORKFLOW</span></div>
          <div className="workflow-line">
            <span><Icon name="upload" /></span><i /><span><Icon name="wand" /></span><i /><span><Icon name="calendar" /></span><i /><span className="active"><Icon name="send" /></span>
          </div>
          <div className="workflow-labels"><span>Upload</span><span>Prepare</span><span>Schedule</span><span>Publish</span></div>
          <div className="workflow-success"><Icon name="check" size={17} /><div><strong>Ready for every channel</strong><small>Your content workflow is connected.</small></div></div>
        </div>
      </section>

      <section className="landing-benefits" id="benefits">
        <div><strong>4×</strong><span>faster content<br />preparation</span></div>
        <div><strong>1</strong><span>workspace for<br />every platform</span></div>
        <div><strong>24/7</strong><span>automated<br />publishing</span></div>
        <div><strong>0</strong><span>forgotten<br />drafts</span></div>
      </section>

      <section className="landing-cta">
        <div className="cta-orb one" /><div className="cta-orb two" />
        <span>YOUR NEXT POST STARTS HERE</span>
        <h2>Turn your ideas into<br />a presence people remember.</h2>
        <p>Join the creators building smarter, more consistent brands with Storiq.</p>
        <button className="landing-primary" onClick={onLogin} type="button">
          Enter the studio <Icon name="send" size={16} />
        </button>
      </section>

      <footer className="landing-footer">
        <EntryBrand />
        <p>Content creation and publishing, beautifully connected.</p>
        <span>Powered by Reigndev</span>
      </footer>
    </main>
  );
}

const pricingPlans = [
  {
    name: "Starter",
    eyebrow: "FOR INDIVIDUAL CREATORS",
    description: "Perfect for coaches, influencers, and small business owners.",
    setup: "R3,999",
    monthly: "R499",
    action: "Get started",
    accent: "violet",
    features: [
      "Multi-platform content posting",
      "Initial setup and onboarding",
      "Workflow monitoring",
      "Bug fixes",
      "Platform API maintenance",
      "Basic training",
    ],
    bestFor: ["Personal brands", "Fitness coaches", "Consultants", "Small businesses", "Content creators"],
    benefit: "Save 5–10 hours of manual posting every month.",
  },
  {
    name: "Agency",
    eyebrow: "FOR TEAMS AND AGENCIES",
    description: "Built for marketing agencies and social media teams.",
    setup: "R7,000",
    monthly: "R1,999",
    action: "Book a demo",
    accent: "cyan",
    popular: true,
    features: [
      "Everything in Starter",
      "Multiple client brand management",
      "Custom branding",
      "Minor enhancements",
      "Team onboarding",
      "Advanced workflow monitoring",
      "Dedicated training session",
    ],
    bestFor: ["Marketing agencies", "Social media managers", "Digital marketing teams"],
    benefit: "Manage multiple clients from a single automation system.",
  },
  {
    name: "Enterprise",
    eyebrow: "FOR MULTI-BRAND OPERATIONS",
    description: "Designed for organizations managing multiple brands.",
    setup: "R15,000",
    monthly: "R3,999",
    action: "Talk to an expert",
    accent: "orange",
    features: [
      "Everything in Agency",
      "Fully customized workflows",
      "AI content assistance",
      "Advanced reporting",
      "Priority support",
      "Multi-brand management",
      "Custom integrations",
      "Ongoing optimization",
      "Dedicated implementation support",
    ],
    bestFor: ["Large businesses", "Franchises", "Multi-brand organizations", "Corporate marketing teams"],
    benefit: "Scale content operations across multiple brands without increasing workload.",
  },
];

function PricingPage({
  onBack,
  onGetStarted,
}: {
  onBack: () => void;
  onGetStarted: () => void;
}) {
  return (
    <main className="pricing-page">
      <nav className="landing-nav pricing-nav">
        <button className="pricing-brand-button" onClick={onBack} type="button"><EntryBrand /></button>
        <div className="pricing-nav-title">Plans & pricing</div>
        <div className="landing-nav-actions">
          <button className="landing-signin" onClick={onBack} type="button">Back to home</button>
          <button className="landing-primary small" onClick={onGetStarted} type="button">
            Get started <Icon name="send" size={14} />
          </button>
        </div>
      </nav>

      <section className="pricing-hero">
        <div className="pricing-grid-glow" />
        <div className="hero-pill"><span /> BUILT TO SAVE YOU TIME</div>
        <h1>Automate your content.<br /><em>Grow your brand.</em></h1>
        <p>
          Publish content across multiple social media platforms from one dashboard
          and stay consistent without spending hours posting manually.
        </p>
        <div className="pricing-benefit-row">
          {[
            "Schedule weeks or months ahead",
            "Publish everywhere automatically",
            "Stay consistently visible",
          ].map((item) => (
            <span key={item}><Icon name="check" size={13} /> {item}</span>
          ))}
        </div>
      </section>

      <section className="pricing-plans">
        {pricingPlans.map((plan) => (
          <article className={`pricing-card ${plan.popular ? "popular" : ""}`} key={plan.name}>
            {plan.popular && <div className="popular-label">MOST POPULAR</div>}
            <div className={`plan-mark ${plan.accent}`}><Icon name={plan.name === "Starter" ? "sparkles" : plan.name === "Agency" ? "workflow" : "analytics"} size={20} /></div>
            <span className="plan-eyebrow">{plan.eyebrow}</span>
            <h2>{plan.name}</h2>
            <p className="plan-description">{plan.description}</p>
            <div className="plan-pricing">
              <div><small>SETUP FEE</small><strong>{plan.setup}</strong><span>once-off</span></div>
              <i />
              <div><small>MONTHLY SUPPORT</small><strong>{plan.monthly}</strong><span>/ month</span></div>
            </div>
            <button className={`plan-action ${plan.accent}`} onClick={onGetStarted} type="button">
              {plan.action} <Icon name="send" size={14} />
            </button>
            <div className="plan-divider" />
            <h3>What's included</h3>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}><span><Icon name="check" size={11} /></span>{feature}</li>
              ))}
            </ul>
            <div className="plan-best">
              <small>BEST FOR</small>
              <div>{plan.bestFor.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
            <div className="plan-benefit"><Icon name="zap" size={15} /><p>{plan.benefit}</p></div>
          </article>
        ))}
      </section>

      <section className="pricing-included">
        <div className="pricing-section-copy">
          <span>WHAT'S INCLUDED</span>
          <h2>One connected workflow.<br />Every channel covered.</h2>
          <p>
            The Reigndev Social Media Automation System moves content from upload
            to publication while keeping your team informed at every step.
          </p>
          <div className="included-points">
            {[
              "Batch-create and upload content",
              "Schedule weeks ahead",
              "Reduce missed opportunities",
              "Focus on clients and revenue",
            ].map((item) => <div key={item}><Icon name="check" size={13} />{item}</div>)}
          </div>
        </div>
        <div className="automation-map">
          <div className="automation-map-head"><EntryBrand /><span>REIGNDEV AUTOMATION</span></div>
          <div className="automation-source"><span><Icon name="upload" size={18} /></span><div><small>STEP 01</small><strong>Upload content</strong></div></div>
          <i className="automation-connector" />
          <div className="automation-source"><span><Icon name="calendar" size={18} /></span><div><small>STEP 02</small><strong>Choose date & time</strong></div></div>
          <i className="automation-connector" />
          <div className="automation-source active"><span><Icon name="workflow" size={18} /></span><div><small>STEP 03</small><strong>Automated scheduling</strong></div></div>
          <div className="automation-platforms">
            {platforms.map((platform) => <span key={platform.name}><Icon name={platform.icon} size={14} />{platform.name}</span>)}
          </div>
          <div className="automation-notice"><Icon name="check" size={14} /> Publishing notification sent</div>
        </div>
      </section>

      <section className="clients-love">
        <div className="landing-section-heading">
          <span>WHY CLIENTS LOVE IT</span>
          <h2>More consistency.<br />Less manual work.</h2>
          <p>Build an online presence that keeps moving—even while you focus elsewhere.</p>
        </div>
        <div className="love-grid">
          {[
            ["clock", "Save hours every month", "Replace repetitive manual posting with one efficient, connected workflow."],
            ["calendar", "Plan with confidence", "Batch content and schedule campaigns weeks or months ahead."],
            ["analytics", "Stay visible online", "Maintain a reliable publishing rhythm across every selected platform."],
            ["zap", "Focus on growth", "Give your team more time for clients, creativity, strategy, and revenue."],
          ].map(([icon, title, description]) => (
            <article key={title}><span><Icon name={icon as IconName} size={19} /></span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="pricing-final-cta">
        <span>READY TO AUTOMATE YOUR SOCIAL MEDIA?</span>
        <h2>Go from manual posting<br />to effortless consistency.</h2>
        <p>Setup in as little as 24–48 hours. Built, monitored, and supported by Reigndev.</p>
        <div>
          <button className="landing-primary" onClick={onGetStarted} type="button">Schedule a free consultation <Icon name="calendar" size={15} /></button>
          <button className="landing-secondary" onClick={onGetStarted} type="button">Get started today <Icon name="send" size={14} /></button>
        </div>
      </section>

      <footer className="landing-footer">
        <EntryBrand />
        <p>Automate your content. Grow your brand.</p>
        <span>BUILT & SUPPORTED BY REIGNDEV</span>
      </footer>
    </main>
  );
}

function AuthScreen({
  mode,
  onBack,
  onSuccess,
  onSwitch,
  onGuest,
  notice,
}: {
  mode: "login" | "signup";
  onBack: () => void;
  onSuccess: (session?: BackendSession) => void;
  onSwitch: () => void;
  onGuest: () => void;
  notice?: string;
}) {
  const isSignUp = mode === "signup";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    "google" | "facebook" | null
  >(null);

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    if (isSignUp && !firstName.trim()) {
      setLoginError("Enter your first name.");
      return;
    }
    if (isSignUp && !lastName.trim()) {
      setLoginError("Enter your last name.");
      return;
    }
    if (isSignUp && !phoneNumber.trim()) {
      setLoginError("Enter your phone number.");
      return;
    }
    if (!email.includes("@")) {
      setLoginError("Enter a valid email address.");
      return;
    }
    if (!password || (isSignUp && password.length < 6)) {
      setLoginError(isSignUp
        ? "Password must contain at least 6 characters."
        : "Enter your password.");
      return;
    }
    if (isSignUp && confirmPassword !== password) {
      setLoginError("Confirm password must match password.");
      return;
    }
    setSubmitting(true);
    setLoginError("");
    try {
      if (isSignUp) {
        await registerWithBackend({
          email: email.trim(),
          password,
          confirmPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          role: 1,
        });
      } else {
        const session = await loginWithBackend({ email: email.trim(), password });
        onSuccess(session);
        return;
      }
      onSuccess();
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : isSignUp ? "Could not complete registration." : "Could not sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function socialLogin(provider: "google" | "facebook") {
    setSocialLoading(provider);
    setLoginError("");
    try {
      await signInWithSocialProvider(provider);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : `Could not continue with ${provider}.`,
      );
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-visual">
        <img alt="Creator using a camera to produce social content" src={creatorPhoto} />
        <div className="login-visual-overlay" />
        <button className="login-back" onClick={onBack} type="button">← Back</button>
        <div className="login-visual-copy">
          <EntryBrand />
          <span>CREATE WITH INTENTION</span>
          <h1>Your audience is waiting.<br />Make the moment count.</h1>
          <p>Plan, preview, and publish every story from one connected studio.</p>
        </div>
        <a className="login-credit" href="https://unsplash.com/@alex_gruber" rel="noreferrer" target="_blank">Photo by Alex Gruber</a>
      </section>
      <section className="login-form-side">
        <div className="login-mobile-brand"><EntryBrand /></div>
        <form className="login-form" onSubmit={submitLogin}>
          <div className="login-heading">
            <span>{isSignUp ? "JOIN STORIQ" : "WELCOME BACK"}</span>
            <h2>{isSignUp ? "Create your Storiq account" : "Sign in to Storiq"}</h2>
            <p>{isSignUp
              ? "Set up your profile to start creating and publishing content."
              : "Continue creating content that moves with you."}</p>
          </div>
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <fieldset className="auth-fields" disabled={submitting || socialLoading !== null}>
          {isSignUp && <>
          <label>
            <span>First name</span>
            <div className="login-input"><span>ID</span><input autoComplete="given-name" onChange={(event) => setFirstName(event.target.value)} placeholder="First name" type="text" value={firstName} /></div>
          </label>
          <label>
            <span>Last name</span>
            <div className="login-input"><span>ID</span><input autoComplete="family-name" onChange={(event) => setLastName(event.target.value)} placeholder="Last name" type="text" value={lastName} /></div>
          </label>
          <label>
            <span>Phone number</span>
            <div className="login-input"><span>#</span><input autoComplete="tel" onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+27 71 234 5678" type="tel" value={phoneNumber} /></div>
          </label>
          </>}
          <label>
            <span>Email address</span>
            <div className="login-input"><span aria-hidden="true">@</span><input required autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} /></div>
          </label>
          <label>
            <span>Password</span>
            <div className="login-input"><span aria-hidden="true">••</span><input required autoComplete={isSignUp ? "new-password" : "current-password"} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" type={showPassword ? "text" : "password"} value={password} /><button onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? "Hide" : "Show"}</button></div>
          </label>
          {isSignUp && (
          <label>
            <span>Confirm password</span>
            <div className="login-input"><span>••</span><input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} /><button onClick={() => setShowConfirmPassword((current) => !current)} type="button">{showConfirmPassword ? "Hide" : "Show"}</button></div>
          </label>
          )}
          {loginError && <div className="login-error" role="alert">{loginError}</div>}
          <button className="login-submit" disabled={submitting || socialLoading !== null} type="submit">
            {submitting
              ? isSignUp ? "Creating your account..." : "Signing in..."
              : isSignUp ? "Create account" : "Sign in"} {!submitting && <Icon name="send" size={15} />}
          </button>
          <p className="auth-switch">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={onSwitch} type="button">{isSignUp ? "Sign in" : "Sign up"}</button>
          </p>
          <div className="login-divider"><span>or continue with</span></div>
          <div className="social-login-grid">
            <button
              disabled={socialLoading !== null}
              onClick={() => socialLogin("google")}
              type="button"
            >
              <Icon name="google" size={17} />
              {socialLoading === "google" ? "Connecting..." : "Google"}
            </button>
            <button
              disabled={socialLoading !== null}
              onClick={() => socialLogin("facebook")}
              type="button"
            >
              <Icon name="facebook" size={17} />
              {socialLoading === "facebook" ? "Connecting..." : "Facebook"}
            </button>
          </div>
          <button className="guest-login" onClick={onGuest} type="button">Continue as guest</button>
          </fieldset>
          <p className="login-terms">By continuing, you agree to the Terms of Service and Privacy Policy.</p>
        </form>
        <div className="login-powered">POWERED BY REIGNDEV</div>
      </section>
    </main>
  );
}

export default function App() {
  const [entryScreen, setEntryScreen] = useState<
    "splash" | "landing" | "pricing" | "login" | "signup" | "app"
  >("splash");
  const [authNotice, setAuthNotice] = useState("");
  const [backendSession, setBackendSession] = useState<BackendSession | null>(null);
  const [socialUser, setSocialUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [activeNav, setActiveNav] = useState("Create");
  const [contentType, setContentType] = useState<"Image" | "Video">("Image");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram", "TikTok"]);
  const [scheduled, setScheduled] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cropWarning, setCropWarning] = useState<{
    fileNames: string[];
    resolve: (accepted: boolean) => void;
  } | null>(null);

  function resolveCropWarning(accepted: boolean) {
    cropWarning?.resolve(accepted);
    setCropWarning(null);
  }
  const [publishError, setPublishError] = useState("");
  const [workflowConnection, setWorkflowConnection] = useState<
    "unverified" | "connected" | "disconnected"
  >("unverified");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [processingUpload, setProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [failedMediaUrl, setFailedMediaUrl] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState("Instagram");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaUrlsRef = useRef<string[]>([]);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);
  const [contentCopies, setContentCopies] = useState<
    Array<{ caption: string; hashtags: string }>
  >([]);
  const [contentDesigns, setContentDesigns] = useState<
    Array<{
      visualStyle: "editorial" | "clean" | "warm" | "monochrome";
      aspectRatio: "portrait" | "square" | "landscape" | "story";
    }>
  >([]);
  const [scheduleMode, setScheduleMode] = useState<"smart" | "now">("smart");
  const [contentSchedules, setContentSchedules] = useState<
    Array<{ date: string; time: string }>
  >([]);
  const localTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [selectedTimezone, setSelectedTimezone] = useState(localTimezone);
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "image" | "video">(
    "all",
  );
  const timezoneOptions = Array.from(
    new Set([
      localTimezone,
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Australia/Sydney",
    ]),
  );
  const filteredLibraryItems = mediaFiles
    .map((file, index) => ({ file, index }))
    .filter(({ file, index }) => {
      const typeMatches =
        libraryFilter === "all" ||
        (libraryFilter === "image" && file.type.startsWith("image/")) ||
        (libraryFilter === "video" && file.type.startsWith("video/"));
      const searchValue = librarySearch.trim().toLowerCase();
      const copy = contentCopies[index];
      const searchMatches =
        !searchValue ||
        file.name.toLowerCase().includes(searchValue) ||
        copy?.caption.toLowerCase().includes(searchValue) ||
        copy?.hashtags.toLowerCase().includes(searchValue);
      return typeMatches && searchMatches;
    });

  useEffect(() => {
    if (entryScreen !== "splash") return;
    const splashTimer = window.setTimeout(() => setEntryScreen("landing"), 1800);
    return () => window.clearTimeout(splashTimer);
  }, [entryScreen]);

  useEffect(() => {
    let active = true;
    const callbackError = consumeSocialLoginError();
    if (callbackError) {
      setAuthNotice(callbackError);
      setEntryScreen("login");
    }
    const showSessionError = () => {
      if (!active) return;
      setAuthNotice("Could not restore your social login session. Please sign in again.");
      setEntryScreen("login");
    };
    authClient.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        showSessionError();
        return;
      }
      if (data.session) {
        setSocialUser(getSocialUserProfile(data.session.user));
        setEntryScreen("app");
      }
    }).catch(showSessionError);
    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSocialUser(session ? getSocialUserProfile(session.user) : null);
      if (session) {
        setBackendSession(null);
        setAuthNotice("");
        setEntryScreen("app");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (publishing || processingUpload || loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      if (socialUser) {
        const { error } = await authClient.auth.signOut();
        if (error) throw error;
      }
      setBackendSession(null);
      setSocialUser(null);
      mediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      mediaUrlsRef.current = [];
      setMediaFiles([]);
      setMediaUrls([]);
      setContentCopies([]);
      setContentDesigns([]);
      setContentSchedules([]);
      setActiveMediaIndex(0);
      setScheduled(false);
      setPublishError("");
      setUploadError("");
      setFailedMediaUrl("");
      setWorkflowConnection("unverified");
      setShowNotifications(false);
      setNotificationsRead(false);
      setLibrarySearch("");
      setLibraryFilter("all");
      setActiveNav("Create");
      setSelectedPlatforms(["Instagram", "TikTok"]);
      setScheduleMode("smart");
      setSelectedTimezone(localTimezone);
      setEditingTimezone(false);
      setPreviewPlatform("Instagram");
      setAuthNotice("You have been logged out.");
      setEntryScreen("login");
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(
    () => () => {
      mediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const mediaFile = mediaFiles[activeMediaIndex] ?? null;
  const mediaUrl = mediaUrls[activeMediaIndex] ?? "";
  const activeCopy = contentCopies[activeMediaIndex] ?? {
    caption: "",
    hashtags: "",
  };
  const caption = activeCopy.caption;
  const hashtags = activeCopy.hashtags;
  const activeDesign = contentDesigns[activeMediaIndex] ?? {
    visualStyle: "editorial" as const,
    aspectRatio: "portrait" as const,
  };
  const mediaClassName = `social-media visual-${activeDesign.visualStyle} ratio-${activeDesign.aspectRatio}`;
  const hasIncompleteSchedule =
    scheduleMode === "smart" &&
    (contentSchedules.length !== mediaFiles.length ||
      contentSchedules.some((schedule) => !schedule.date || !schedule.time));

  useEffect(() => {
    if (mediaFile) {
      setContentType(mediaFile.type.startsWith("video/") ? "Video" : "Image");
    }
  }, [mediaFile]);

  const statusText = scheduled
    ? scheduleMode === "now"
      ? "Published through n8n"
      : `${mediaFiles.length} content item${mediaFiles.length === 1 ? "" : "s"} scheduled`
    : mediaFiles.length
      ? `${mediaFiles.length} content item${mediaFiles.length === 1 ? "" : "s"} ready`
      : "Upload content to preview";

  function togglePlatform(name: string) {
    setSelectedPlatforms((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  async function normalizePhoneMedia(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isHeic =
      ["heic", "heif"].includes(extension ?? "") ||
      ["image/heic", "image/heif"].includes(file.type.toLowerCase());

    if (isHeic) {
      const { default: heic2any } = await import("heic2any");
      const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      });
      const convertedBlob = Array.isArray(result) ? result[0] : result;
      const convertedName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      return new File([convertedBlob], convertedName, {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
    }

    if (!file.type && extension) {
      const inferredTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
      };
      const inferredType = inferredTypes[extension];
      if (inferredType) {
        return new File([file], file.name, {
          type: inferredType,
          lastModified: file.lastModified,
        });
      }
    }

    return file;
  }

  async function selectMedia(files?: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;
    setProcessingUpload(true);
    setUploadError("");

    try {
      const incomingFiles: File[] = [];
      for (const file of selectedFiles) {
        incomingFiles.push(await normalizePhoneMedia(file));
      }
      const baseIndex = mediaFiles.length;
      const incomingSchedules = incomingFiles.map((_, index) => ({
        date: futureDate(baseIndex + index + 1),
        time: "09:30",
      }));
      const incomingUrls = incomingFiles.map((file) => URL.createObjectURL(file));
      setMediaFiles((current) => {
        setActiveMediaIndex(current.length);
        return [...current, ...incomingFiles];
      });
      setMediaUrls((current) => {
        const nextUrls = [...current, ...incomingUrls];
        mediaUrlsRef.current = nextUrls;
        return nextUrls;
      });
      setContentSchedules((current) => [
        ...current,
        ...incomingSchedules,
      ]);
      setContentCopies((current) => [
        ...current,
        ...incomingFiles.map(() => ({ caption: "", hashtags: "" })),
      ]);
      setContentDesigns((current) => [
        ...current,
        ...incomingFiles.map(() => ({
          visualStyle: "editorial" as const,
          aspectRatio: "portrait" as const,
        })),
      ]);
      setContentType(
        incomingFiles[0].type.startsWith("video/") ? "Video" : "Image",
      );
      setScheduled(false);
      setPublishError("");
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "This media could not be prepared or saved. Please try again.",
      );
    } finally {
      setProcessingUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function selectQueuedMedia(index: number) {
    const file = mediaFiles[index];
    setFailedMediaUrl("");
    setActiveMediaIndex(index);
    setContentType(file?.type.startsWith("video/") ? "Video" : "Image");
  }

  function removeMedia(index: number) {
    const removedUrl = mediaUrls[index];
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMediaUrls((current) => {
      const nextUrls = current.filter((_, itemIndex) => itemIndex !== index);
      mediaUrlsRef.current = nextUrls;
      return nextUrls;
    });
    setContentSchedules((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setContentCopies((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setContentDesigns((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setActiveMediaIndex((current) => Math.max(0, Math.min(current, mediaFiles.length - 2)));
    setScheduled(false);
    setPublishError("");
  }

  function updateActiveCopy(
    field: "caption" | "hashtags",
    value: string | ((current: string) => string),
  ) {
    if (!mediaFile) return;
    setContentCopies((current) =>
      current.map((copy, index) =>
        index === activeMediaIndex
          ? {
              ...copy,
              [field]:
                typeof value === "function" ? value(copy[field]) : value,
            }
          : copy,
      ),
    );
    setScheduled(false);
  }

  function updateActiveDesign(
    field: "visualStyle" | "aspectRatio",
    value: "editorial" | "clean" | "warm" | "monochrome" | "portrait" | "square" | "landscape" | "story",
  ) {
    if (!mediaFile) return;
    setContentDesigns((current) =>
      current.map((design, index) =>
        index === activeMediaIndex ? { ...design, [field]: value } : design,
      ),
    );
    setScheduled(false);
  }

  function updateContentSchedule(
    index: number,
    field: "date" | "time",
    value: string,
  ) {
    setContentSchedules((current) =>
      current.map((schedule, itemIndex) =>
        itemIndex === index ? { ...schedule, [field]: value } : schedule,
      ),
    );
    setScheduled(false);
    setPublishError("");
  }

  async function scheduleContent() {
    setPublishing(true);
    setPublishError("");

    try {
      const platformTypes = selectedPlatforms.map(
        (platform) => platformIdentifiers[platform],
      );
      const uncroppedFileNames: string[] = [];
      const publishFiles = await Promise.all(
        mediaFiles.map((file, index) =>
          cropImageToAspectRatio(
            file,
            contentDesigns[index]?.aspectRatio ?? "portrait",
          ).catch((error) => {
            console.warn(`Could not crop ${file.name}; sending original.`, error);
            uncroppedFileNames.push(file.name);
            return file;
          }),
        ),
      );
      if (uncroppedFileNames.length > 0) {
        const accepted = await new Promise<boolean>((resolve) =>
          setCropWarning({ fileNames: uncroppedFileNames, resolve }),
        );
        if (!accepted) return;
      }
      const fileCategories = new Set(
        publishFiles.map((file) => file.type.split("/")[0]),
      );
      const batchContentType =
        fileCategories.size > 1
          ? "mixed"
          : publishFiles[0]?.type.startsWith("video/")
            ? "video"
            : "image";
      const payload: N8nWorkflowPayload = {
        schemaVersion: "1.0",
        eventType:
          scheduleMode === "smart"
            ? "content.schedule"
            : "content.publish_now",
        requestId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        source: "storiq-web",
        timezone: selectedTimezone,
        publishMode: scheduleMode,
        status: scheduleMode === "smart" ? "scheduled" : "publish_now",
        contentType: batchContentType,
        platformTypes,
        contentCount: publishFiles.length,
        content: publishFiles.map((file, index) => ({
          index,
          fileName: file.name,
          fileType: file.type,
          fileSizeBytes: file.size,
          platformTypes,
          fileContent: {
            transferType: "multipart_binary",
            fieldName: `fileContent_${index}`,
          },
          caption: contentCopies[index]?.caption.trim() ?? "",
          hashtags: contentCopies[index]?.hashtags.trim() ?? "",
          visualStyle: contentDesigns[index]?.visualStyle ?? "editorial",
          aspectRatio: contentDesigns[index]?.aspectRatio ?? "portrait",
          scheduledFor:
            scheduleMode === "smart" && contentSchedules[index]
              ? zonedDateTimeToIso(
                  contentSchedules[index].date,
                  contentSchedules[index].time,
                  selectedTimezone,
                )
              : null,
        })),
      };

      await triggerN8nWorkflow({
        webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
        payload,
        files: publishFiles,
      });
      setWorkflowConnection("connected");
      setScheduled(true);
    } catch (error) {
      if (error instanceof N8nConnectionError) {
        setWorkflowConnection("disconnected");
      } else if (error instanceof N8nWebhookResponseError) {
        setWorkflowConnection("connected");
      }
      setPublishError(
        error instanceof Error
          ? error.message
          : "The n8n workflow could not be started.",
      );
    } finally {
      setPublishing(false);
    }
  }

  const previewMedia = mediaUrl ? (
    <div className="uploaded-preview">
      {failedMediaUrl === mediaUrl ? (
        <div className="media-preview-error">
          <Icon name={contentType === "Video" ? "video" : "image"} size={25} />
          <strong>Preview unavailable</strong>
          <span>Replace this file or upload a JPEG, PNG, WebP, MP4, or MOV file.</span>
        </div>
      ) : contentType === "Video" ? (
        <video
          controls
          onError={() => setFailedMediaUrl(mediaUrl)}
          onLoadedData={() => setFailedMediaUrl("")}
          playsInline
          preload="metadata"
          src={mediaUrl}
        >
          Your browser does not support video preview.
        </video>
      ) : (
        <img
          alt="Uploaded content preview"
          onError={() => setFailedMediaUrl(mediaUrl)}
          onLoad={() => setFailedMediaUrl("")}
          src={mediaUrl}
        />
      )}
      <div className="media-badge">
        <Icon name={contentType === "Video" ? "video" : "image"} size={13} />
        Your upload
      </div>
      <button
        className="replace-media"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        Replace
      </button>
    </div>
  ) : (
    <div className="post-art">
      <div className="art-orb art-orb-one" />
      <div className="art-orb art-orb-two" />
      <div className="art-noise" />
      <div className="art-brand">
        <Icon name="sparkles" size={16} />
        STORIQ CREATOR LAB
      </div>
      <div className="art-copy">
        <span>THE CREATOR PLAYBOOK</span>
        <strong>CREATE. GROW. REPEAT.</strong>
        <p>A smarter system for your boldest ideas.</p>
      </div>
      <div className="art-footer">
        <span>JOIN THE NEXT WAVE</span>
        <span>→</span>
      </div>
    </div>
  );

  if (entryScreen === "splash") return <SplashScreen />;
  if (entryScreen === "landing") {
    return (
      <LandingPage
        onDemo={() => setEntryScreen("app")}
        onLogin={() => setEntryScreen("login")}
        onPricing={() => setEntryScreen("pricing")}
      />
    );
  }
  if (entryScreen === "pricing") {
    return (
      <PricingPage
        onBack={() => setEntryScreen("landing")}
        onGetStarted={() => setEntryScreen("signup")}
      />
    );
  }
  if (entryScreen === "login" || entryScreen === "signup") {
    return (
      <AuthScreen
        key={entryScreen}
        mode={entryScreen}
        onGuest={() => setEntryScreen("app")}
        notice={entryScreen === "login" ? authNotice : undefined}
        onBack={() => setEntryScreen("landing")}
        onSwitch={() => {
          setAuthNotice("");
          setEntryScreen(entryScreen === "login" ? "signup" : "login");
        }}
        onSuccess={(session) => {
          if (entryScreen === "signup") {
            setAuthNotice("Account created. Sign in with your email and password.");
            setEntryScreen("login");
          } else {
            if (!session) return;
            setBackendSession(session);
            setAuthNotice("");
            setEntryScreen("app");
          }
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="sparkles" size={22} />
          </div>
          <span>Storiq</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              type="button"
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === "Create" && <span className="nav-key">C</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="n8n-card">
            <div className="n8n-top">
              <div className="n8n-logo">
                <Icon name="workflow" size={18} />
              </div>
              <span className="status-dot" />
            </div>
            <strong>Storiq connected</strong>
            <p>4 workflows are active</p>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {activeNav === "Calendar"
                ? "CONTENT CALENDAR"
                : activeNav === "Content Library"
                  ? "MEDIA WORKSPACE"
                  : "AI CONTENT STUDIO"}
            </p>
            <h1>
              {activeNav === "Calendar"
                ? "Your publishing timeline"
                : activeNav === "Content Library"
                  ? "Content library"
                  : "Bring your next idea to life"}
            </h1>
          </div>
          <div className="top-actions">
            <div className="credits">
              <Icon name="zap" size={15} />
              <span>
                {backendSession || socialUser ? (
                  <b>{getPlanLabel((backendSession?.user ?? socialUser)?.role ?? null)}</b>
                ) : <b>Guest</b>}
              </span>
            </div>
            <button
              aria-expanded={showNotifications}
              aria-label="Notifications"
              className="icon-btn"
              onClick={() => setShowNotifications((current) => !current)}
              type="button"
            >
              <Icon name="bell" size={20} />
              {!notificationsRead && <span className="notification-dot" />}
            </button>
            {showNotifications && (
              <div className="notifications-panel">
                <div className="notifications-head">
                  <div>
                    <strong>Notifications</strong>
                    <span>{notificationsRead ? "You're all caught up" : "2 unread updates"}</span>
                  </div>
                  <button
                    onClick={() => setNotificationsRead(true)}
                    type="button"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  <button
                    className={!notificationsRead ? "unread" : ""}
                    onClick={() => {
                      setActiveNav("Calendar");
                      setShowNotifications(false);
                      setNotificationsRead(true);
                    }}
                    type="button"
                  >
                    <span className="notification-icon success">
                      <Icon name="calendar" size={16} />
                    </span>
                    <span>
                      <strong>
                        {scheduled
                          ? `${mediaFiles.length} content item${mediaFiles.length === 1 ? "" : "s"} scheduled`
                          : "Your publishing timeline is ready"}
                      </strong>
                      <small>Open Calendar to review your content schedule.</small>
                      <i>Just now</i>
                    </span>
                  </button>
                  <button
                    className={!notificationsRead ? "unread" : ""}
                    onClick={() => {
                      setActiveNav("Create");
                      setShowNotifications(false);
                      setNotificationsRead(true);
                    }}
                    type="button"
                  >
                    <span className="notification-icon">
                      <Icon name="sparkles" size={16} />
                    </span>
                    <span>
                      <strong>Storiq is connected</strong>
                      <small>Your publishing workflow is ready to receive content.</small>
                      <i>Today</i>
                    </span>
                  </button>
                </div>
                <div className="notifications-foot">
                  <Icon name="check" size={13} />
                  Powered by Reigndev
                </div>
              </div>
            )}
            <button className="new-btn" onClick={() => setActiveNav("Create")} type="button">
              <Icon name="plus" size={18} />
              New content
            </button>
            <UserProfileMenu
              user={backendSession?.user ?? socialUser}
              disabled={publishing || processingUpload || loggingOut}
              loggingOut={loggingOut}
              error={logoutError}
              onLogout={logout}
            />
          </div>
        </header>

        {activeNav === "Calendar" ? (
          <section className="calendar-page">
            <div className="calendar-summary">
              <div>
                <span className="summary-icon violet"><Icon name="calendar" size={18} /></span>
                <div><small>CONTENT PLANNED</small><strong>{mediaFiles.length}</strong></div>
              </div>
              <div>
                <span className="summary-icon cyan"><Icon name="send" size={18} /></span>
                <div><small>CHANNELS</small><strong>{selectedPlatforms.length}</strong></div>
              </div>
              <div>
                <span className="summary-icon green"><Icon name="clock" size={18} /></span>
                <div>
                  <small>NEXT PUBLISH</small>
                  <strong>
                    {contentSchedules[0]
                      ? new Date(`${contentSchedules[0].date}T12:00:00`).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="timeline-card">
              <div className="timeline-card-head">
                <div>
                  <h2>Publishing timeline</h2>
                  <p>Review every scheduled post in one place.</p>
                </div>
                <span className={`timeline-status ${scheduled ? "live" : ""}`}>
                  <i /> {scheduled ? "Schedule active" : "Draft schedule"}
                </span>
              </div>

              {mediaFiles.length ? (
                <div className="timeline-list">
                  {mediaFiles.map((file, index) => {
                    const itemSchedule = contentSchedules[index];
                    const isVideo = file.type.startsWith("video/");
                    return (
                      <article className="timeline-item" key={`${file.name}-${file.lastModified}-${index}`}>
                        <div className="timeline-date">
                          <strong>
                            {itemSchedule
                              ? new Date(`${itemSchedule.date}T12:00:00`)
                                  .toLocaleDateString(undefined, { day: "2-digit" })
                              : "—"}
                          </strong>
                          <span>
                            {itemSchedule
                              ? new Date(`${itemSchedule.date}T12:00:00`)
                                  .toLocaleDateString(undefined, { month: "short" })
                                  .toUpperCase()
                              : "DATE"}
                          </span>
                        </div>
                        <div className="timeline-rail"><i /></div>
                        <div className="timeline-media">
                          {!isVideo && mediaUrls[index] ? (
                            <img alt="" src={mediaUrls[index]} />
                          ) : (
                            <Icon name={isVideo ? "video" : "image"} size={20} />
                          )}
                        </div>
                        <div className="timeline-info">
                          <span className="timeline-time">
                            <Icon name="clock" size={12} />
                            {itemSchedule?.time || "No time"}
                          </span>
                          <strong>{file.name}</strong>
                          <small>{isVideo ? "Video post" : "Image post"} · {(file.size / 1024 / 1024).toFixed(1)} MB</small>
                          <p>{contentCopies[index]?.caption || "No caption added yet"}</p>
                          <div className="timeline-platforms">
                            {selectedPlatforms.map((platformName) => {
                              const platform = platforms.find((item) => item.name === platformName);
                              return platform ? (
                                <span key={platform.name} title={platform.name}>
                                  <Icon name={platform.icon} size={12} />
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <div className="timeline-item-actions">
                          <span className={scheduled ? "scheduled" : "draft"}>
                            {scheduled ? "Scheduled" : "Ready to schedule"}
                          </span>
                          <button
                            onClick={() => {
                              selectQueuedMedia(index);
                              setActiveNav("Create");
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="calendar-empty">
                  <span><Icon name="calendar" size={26} /></span>
                  <h2>No content planned yet</h2>
                  <p>Upload content and assign publishing dates to see your timeline here.</p>
                  <button onClick={() => setActiveNav("Create")} type="button">
                    <Icon name="plus" size={15} /> Add content
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : activeNav === "Content Library" ? (
          <section className="library-page">
            <div className="library-toolbar">
              <div className="library-search">
                <Icon name="search" size={17} />
                <input
                  aria-label="Search content library"
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search files, captions or hashtags"
                  type="search"
                  value={librarySearch}
                />
              </div>
              <div className="library-filters" aria-label="Filter content type">
                {(["all", "image", "video"] as const).map((filter) => (
                  <button
                    className={libraryFilter === filter ? "active" : ""}
                    key={filter}
                    onClick={() => setLibraryFilter(filter)}
                    type="button"
                  >
                    {filter === "all" ? "All content" : `${filter}s`}
                  </button>
                ))}
              </div>
              <button
                className="library-add"
                onClick={() => {
                  setActiveNav("Create");
                  window.setTimeout(() => fileInputRef.current?.click(), 0);
                }}
                type="button"
              >
                <Icon name="plus" size={16} /> Add content
              </button>
            </div>

            <div className="library-meta">
              <div>
                <h2>Your content</h2>
                <p>{filteredLibraryItems.length} of {mediaFiles.length} items</p>
              </div>
              <span>Available during this session</span>
            </div>

            {filteredLibraryItems.length ? (
              <div className="library-grid">
                {filteredLibraryItems.map(({ file, index }) => {
                  const isVideo = file.type.startsWith("video/");
                  const copy = contentCopies[index];
                  const design = contentDesigns[index];
                  const itemSchedule = contentSchedules[index];
                  return (
                    <article className="library-card" key={`${file.name}-${file.lastModified}-${index}`}>
                      <div className={`library-media ratio-${design?.aspectRatio ?? "portrait"}`}>
                        {isVideo ? (
                          <>
                            <video muted playsInline preload="metadata" src={mediaUrls[index]} />
                            <span className="library-play"><Icon name="play" size={17} /></span>
                          </>
                        ) : (
                          <img alt={file.name} src={mediaUrls[index]} />
                        )}
                        <span className="library-type">
                          <Icon name={isVideo ? "video" : "image"} size={12} />
                          {isVideo ? "Video" : "Image"}
                        </span>
                        <span className={`library-state ${scheduled ? "scheduled" : ""}`}>
                          {scheduled ? "Scheduled" : "Draft"}
                        </span>
                      </div>
                      <div className="library-card-body">
                        <strong title={file.name}>{file.name}</strong>
                        <small>
                          {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                          {(design?.aspectRatio ?? "portrait").replace(/^./, (letter) =>
                            letter.toUpperCase(),
                          )}
                        </small>
                        <p>{copy?.caption || "No caption added yet"}</p>
                        <div className="library-hashtags">
                          {copy?.hashtags || "No hashtags"}
                        </div>
                        <div className="library-card-foot">
                          <span>
                            <Icon name="calendar" size={12} />
                            {itemSchedule
                              ? `${new Date(`${itemSchedule.date}T12:00:00`).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )} · ${itemSchedule.time}`
                              : "Not scheduled"}
                          </span>
                          <div className="library-platforms">
                            {selectedPlatforms.slice(0, 4).map((platformName) => {
                              const platform = platforms.find(
                                (item) => item.name === platformName,
                              );
                              return platform ? (
                                <i key={platform.name} title={platform.name}>
                                  <Icon name={platform.icon} size={11} />
                                </i>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <div className="library-actions">
                          <button
                            onClick={() => {
                              selectQueuedMedia(index);
                              setActiveNav("Create");
                            }}
                            type="button"
                          >
                            Edit content
                          </button>
                          <button
                            aria-label={`Delete ${file.name}`}
                            className="delete"
                            onClick={() => removeMedia(index)}
                            type="button"
                          >
                            <Icon name="x" size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="library-empty">
                <span><Icon name="library" size={27} /></span>
                <h2>{mediaFiles.length ? "No matching content" : "Your library is empty"}</h2>
                <p>
                  {mediaFiles.length
                    ? "Try changing your search or content filter."
                    : "Upload images and videos to build your content library."}
                </p>
                {!mediaFiles.length && (
                  <button onClick={() => setActiveNav("Create")} type="button">
                    <Icon name="plus" size={15} /> Upload content
                  </button>
                )}
              </div>
            )}
          </section>
        ) : (
        <div className="studio-grid">
          <section className="composer-panel">
            <div className="section-head">
              <div className="step-number">1</div>
              <div>
                <h2>Create your post</h2>
                <p>Upload your content and prepare it to publish.</p>
              </div>
            </div>

            <div className="field-group">
              <label>Content type</label>
              <div className="segmented-control">
                {(["Image", "Video"] as const).map((type) => (
                  <button
                    className={contentType === type ? "selected" : ""}
                    key={type}
                    onClick={() => setContentType(type)}
                    type="button"
                  >
                    <Icon name={type === "Image" ? "image" : "video"} size={18} />
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>Upload your media</label>
                <span>{mediaFiles.length ? `${mediaFiles.length} in queue` : "Images or videos"}</span>
              </div>
              <input
                accept="image/*,video/*"
                aria-label="Upload images or videos"
                className="file-input"
                disabled={processingUpload}
                multiple
                onChange={(event) => selectMedia(event.target.files)}
                ref={fileInputRef}
                type="file"
              />
              {uploadError && <p className="upload-error">{uploadError}</p>}
              {mediaFile ? (
                <>
                  <div className="upload-complete">
                    <div className="file-type-icon">
                      <Icon name={contentType === "Video" ? "video" : "image"} size={19} />
                    </div>
                    <div>
                      <strong>{mediaFile.name}</strong>
                      <span>{(mediaFile.size / 1024 / 1024).toFixed(1)} MB · Item {activeMediaIndex + 1} of {mediaFiles.length}</span>
                    </div>
                    <button
                      aria-label="Remove selected media"
                      onClick={() => removeMedia(activeMediaIndex)}
                      type="button"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <div className="queue-heading">
                    <span>Content queue</span>
                    <button
                      disabled={processingUpload}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Icon name="plus" size={12} /> Add more
                    </button>
                  </div>
                  <div className="content-queue">
                    {mediaFiles.map((file, index) => (
                      <button
                        aria-label={`Preview ${file.name}`}
                        className={activeMediaIndex === index ? "active" : ""}
                        key={`${file.name}-${file.lastModified}-${index}`}
                        onClick={() => selectQueuedMedia(index)}
                        type="button"
                      >
                        <span>{index + 1}</span>
                        <Icon name={file.type.startsWith("video/") ? "video" : "image"} size={15} />
                        <small>{file.name}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button
                  className="upload-zone"
                  disabled={processingUpload}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <span className="upload-icon"><Icon name="upload" size={21} /></span>
                  <span>
                    <strong>
                      {processingUpload
                        ? "Preparing phone media..."
                        : "Choose content from your phone"}
                    </strong>
                    <small>
                      {processingUpload
                        ? "Converting photos for a reliable preview"
                        : "Select multiple images or videos at once"}
                    </small>
                  </span>
                </button>
              )}
            </div>

            <div className="split-fields">
              <div className="field-group">
                <label>Visual style</label>
                <div className="select-btn functional-select">
                  <span><i className={`style-swatch ${activeDesign.visualStyle}`} /></span>
                  <select
                    aria-label="Visual style"
                    disabled={!mediaFile}
                    onChange={(event) =>
                      updateActiveDesign(
                        "visualStyle",
                        event.target.value as typeof activeDesign.visualStyle,
                      )
                    }
                    value={activeDesign.visualStyle}
                  >
                    <option value="editorial">Electric editorial</option>
                    <option value="clean">Clean studio</option>
                    <option value="warm">Warm cinematic</option>
                    <option value="monochrome">Monochrome</option>
                  </select>
                  <Icon name="chevron" size={16} />
                </div>
              </div>
              <div className="field-group">
                <label>Aspect ratio</label>
                <div className="select-btn functional-select">
                  <span><i className={`ratio-icon ${activeDesign.aspectRatio}`} /></span>
                  <select
                    aria-label="Aspect ratio"
                    disabled={!mediaFile}
                    onChange={(event) =>
                      updateActiveDesign(
                        "aspectRatio",
                        event.target.value as typeof activeDesign.aspectRatio,
                      )
                    }
                    value={activeDesign.aspectRatio}
                  >
                    <option value="portrait">Portrait · 4:5</option>
                    <option value="square">Square · 1:1</option>
                    <option value="landscape">Landscape · 1.91:1</option>
                    <option value="story">Story · 9:16</option>
                  </select>
                  <Icon name="chevron" size={16} />
                </div>
              </div>
            </div>

            <div className="caption-editor">
              <div className="editor-heading">
                <div>
                  <span>Caption & hashtags</span>
                  <small>
                    {mediaFile
                      ? `For content ${activeMediaIndex + 1} of ${mediaFiles.length}`
                      : "Upload content to write its caption"}
                  </small>
                </div>
                <button
                  disabled={!mediaFile}
                  onClick={() => {
                    updateActiveCopy(
                      "caption",
                      "Stop waiting for the perfect moment. Turn your next bold idea into content that moves people — and your brand — forward.",
                    );
                    updateActiveCopy(
                      "hashtags",
                      "#CreatorTips #ContentCreator #BuildInPublic",
                    );
                  }}
                  type="button"
                >
                  <Icon name="sparkles" size={13} />
                  Write with AI
                </button>
              </div>
              <div className="caption-input-wrap">
                <textarea
                  aria-label="Post caption"
                  disabled={!mediaFile}
                  maxLength={2200}
                  onChange={(event) => updateActiveCopy("caption", event.target.value)}
                  placeholder="Write a caption for your post..."
                  ref={captionInputRef}
                  value={caption}
                />
                <span>{caption.length}/2,200</span>
              </div>
              <input
                aria-label="Post hashtags"
                disabled={!mediaFile}
                maxLength={250}
                onChange={(event) => updateActiveCopy("hashtags", event.target.value)}
                placeholder="#Creator #Content #Growth"
                type="text"
                value={hashtags}
              />
              <div className="hashtag-suggestions">
                <span>Quick add</span>
                {["#Trending", "#CreatorLife", "#SocialMedia"].map((tag) => (
                  <button
                    disabled={!mediaFile}
                    key={tag}
                    onClick={() =>
                      updateActiveCopy("hashtags", (current) =>
                        current.includes(tag)
                          ? current
                          : `${current.trim()} ${tag}`.trim(),
                      )
                    }
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

          </section>

          <section className="preview-panel">
            <div className="preview-heading">
              <div className="section-head">
                <div className="step-number">2</div>
                <div>
                  <h2>Preview</h2>
                  <p>{statusText}</p>
                </div>
              </div>
              <button aria-label="More preview options" className="ghost-icon" type="button">
                <Icon name="more" size={22} />
              </button>
            </div>

            <div className="platform-tabs" aria-label="Preview platform">
              {platforms.map((platform) => (
                <button
                  aria-label={`Preview on ${platform.name}`}
                  className={previewPlatform === platform.name ? "active" : ""}
                  key={platform.name}
                  onClick={() => setPreviewPlatform(platform.name)}
                  type="button"
                >
                  <Icon name={platform.icon} size={17} />
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>

            <div className={`post-preview platform-${previewPlatform.toLowerCase()}`}>
              {previewPlatform === "Instagram" && (
                <>
                  <div className="native-top instagram-top">
                    <div className="story-avatar"><div className="mini-avatar">YP</div></div>
                    <div><strong>yourhandle</strong><span>Your location</span></div>
                    <Icon name="more" size={19} />
                  </div>
                  <div className={mediaClassName}>{previewMedia}</div>
                  <div className="instagram-actions">
                    <span><Icon name="heart" /><Icon name="comment" /><Icon name="send" /></span>
                    <Icon name="bookmark" />
                  </div>
                  <div className="native-caption">
                    <strong>1,284 likes</strong>
                    <p><b>yourhandle</b> {caption || "Write your caption..."}</p>
                    <span>{hashtags}</span>
                    <small>View all 48 comments · 2 minutes ago</small>
                  </div>
                </>
              )}

              {previewPlatform === "Facebook" && (
                <>
                  <div className="native-top facebook-top">
                    <div className="mini-avatar">YP</div>
                    <div><strong>Your Profile</strong><span>2m · Public</span></div>
                    <Icon name="more" size={19} />
                  </div>
                  <p className="facebook-copy">{caption || "Write your caption..."} <span>{hashtags}</span></p>
                  <div className={mediaClassName}>{previewMedia}</div>
                  <div className="facebook-stats"><span>Like · Love&nbsp; 328</span><span>42 comments · 8 shares</span></div>
                  <div className="facebook-actions">
                    <button type="button"><Icon name="heart" size={16} /> Like</button>
                    <button type="button"><Icon name="comment" size={16} /> Comment</button>
                    <button type="button"><Icon name="send" size={16} /> Share</button>
                  </div>
                </>
              )}

              {previewPlatform === "TikTok" && (
                <div className="tiktok-stage">
                  <div className={mediaClassName}>{previewMedia}</div>
                  <div className="tiktok-top"><span>Following</span><strong>For You</strong></div>
                  <div className="tiktok-actions">
                    <div className="mini-avatar">YP</div>
                    <span><Icon name="heart" size={22} /><small>12.8K</small></span>
                    <span><Icon name="comment" size={22} /><small>486</small></span>
                    <span><Icon name="bookmark" size={22} /><small>1,204</small></span>
                    <span><Icon name="send" size={22} /><small>Share</small></span>
                  </div>
                  <div className="tiktok-caption">
                    <strong>@yourhandle</strong>
                    <p>{caption || "Write your caption..."} <b>{hashtags}</b></p>
                    <span>♫ original sound - Your Profile</span>
                  </div>
                </div>
              )}

              {previewPlatform === "X" && (
                <div className="x-post">
                  <div className="mini-avatar">YP</div>
                  <div className="x-body">
                    <div className="x-user"><strong>Your Profile</strong><span>@yourhandle · 2m</span><Icon name="more" size={18} /></div>
                    <p>{caption || "Write your caption..."} <span>{hashtags}</span></p>
                    <div className={mediaClassName}>{previewMedia}</div>
                    <div className="x-actions">
                      <span><Icon name="comment" size={16} />48</span>
                      <span><Icon name="repeat" size={16} />124</span>
                      <span><Icon name="heart" size={16} />1.2K</span>
                      <span><Icon name="bookmark" size={16} /></span>
                      <Icon name="send" size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="preview-toolbar">
              <button type="button"><Icon name="play" size={17} /> Preview motion</button>
              <button
                onClick={() => {
                  captionInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  captionInputRef.current?.focus({ preventScroll: true });
                }}
                type="button"
              >
                Edit caption
              </button>
            </div>
          </section>

          <aside className="publish-panel">
            <div className="section-head compact">
              <div className="step-number">3</div>
              <div>
                <h2>Publish</h2>
                <p>Choose where and when.</p>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>Platforms</label>
                <span>{selectedPlatforms.length} selected</span>
              </div>
              <div className="platform-list">
                {platforms.map((platform) => {
                  const selected = selectedPlatforms.includes(platform.name);
                  return (
                    <button
                      className={`platform-row ${selected ? "selected" : ""}`}
                      key={platform.name}
                      onClick={() => togglePlatform(platform.name)}
                      type="button"
                    >
                      <span className={`platform-icon ${platform.color}`}>
                        <Icon name={platform.icon} size={18} />
                      </span>
                      <span>{platform.name}</span>
                      <i>{selected && <Icon name="check" size={13} />}</i>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divider" />

            <div className="field-group">
              <label>Publishing time</label>
              <div className="schedule-options">
                <button
                  className={`schedule-option ${scheduleMode === "smart" ? "selected" : ""}`}
                  onClick={() => {
                    setScheduleMode("smart");
                    setScheduled(false);
                    setPublishError("");
                  }}
                  type="button"
                >
                  <span className="radio">{scheduleMode === "smart" && <i />}</span>
                  <span><strong>Smart schedule</strong><small>Best time for engagement</small></span>
                  <span className="ai-pill">AI</span>
                </button>
                <button
                  className={`schedule-option ${scheduleMode === "now" ? "selected" : ""}`}
                  onClick={() => {
                    setScheduleMode("now");
                    setScheduled(false);
                    setPublishError("");
                  }}
                  type="button"
                >
                  <span className="radio">{scheduleMode === "now" && <i />}</span>
                  <span><strong>Post now</strong><small>Publish immediately</small></span>
                </button>
              </div>
            </div>

            {scheduleMode === "smart" ? (
              <div className="content-schedule-list">
                <div className="schedule-list-heading">
                  <span>Publishing timeline</span>
                  <small>{mediaFiles.length} content item{mediaFiles.length === 1 ? "" : "s"}</small>
                </div>
                {mediaFiles.length ? mediaFiles.map((file, index) => {
                  const itemSchedule = contentSchedules[index] ?? {
                    date: futureDate(index + 1),
                    time: "09:30",
                  };
                  return (
                    <div className="content-schedule-row" key={`${file.name}-${file.lastModified}-${index}`}>
                      <div className="scheduled-content-name">
                        <span>{index + 1}</span>
                        <div>
                          <strong>Content {index + 1}</strong>
                          <small>{file.name}</small>
                        </div>
                      </div>
                      <div className="scheduled-fields">
                        <label>
                          <Icon name="calendar" size={13} />
                          <span>
                            <small>DATE</small>
                            <input
                              aria-label={`Publishing date for ${file.name}`}
                              min={today}
                              onChange={(event) =>
                                updateContentSchedule(index, "date", event.target.value)
                              }
                              type="date"
                              value={itemSchedule.date}
                            />
                          </span>
                        </label>
                        <label>
                          <Icon name="clock" size={13} />
                          <span>
                            <small>TIME</small>
                            <input
                              aria-label={`Publishing time for ${file.name}`}
                              onChange={(event) =>
                                updateContentSchedule(index, "time", event.target.value)
                              }
                              type="time"
                              value={itemSchedule.time}
                            />
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty-schedule">
                    Upload content to create its publishing timeline.
                  </div>
                )}
              </div>
            ) : (
              <div className="publish-now-note">
                <Icon name="zap" size={17} />
                <span><strong>Ready to publish now</strong><small>n8n will send this content to every selected platform immediately.</small></span>
              </div>
            )}

            <div className={`workflow-note ${workflowConnection}`}>
              <img
                alt="Reigndev"
                className="reigndev-logo"
                src={reigndevLogo}
              />
              <p>
                <strong>
                  {workflowConnection === "disconnected"
                    ? "Storiq disconnected"
                    : workflowConnection === "connected"
                      ? "Storiq connected"
                      : "Connection not checked"}
                </strong>
                <br />
                {workflowConnection === "disconnected"
                  ? "Could not reach the n8n webhook. Check the connection and URL."
                  : workflowConnection === "connected"
                    ? "Your workflow is reachable and ready to publish."
                    : "The webhook will be checked when you publish content."}
              </p>
              <Icon
                className={`workflow-status-icon ${workflowConnection}`}
                name={
                  workflowConnection === "disconnected"
                    ? "x"
                    : workflowConnection === "connected"
                      ? "check"
                      : "clock"
                }
                size={16}
              />
            </div>

            <button
              className={`schedule-btn ${scheduled ? "done" : ""}`}
              disabled={
                selectedPlatforms.length === 0 ||
                mediaFiles.length === 0 ||
                hasIncompleteSchedule ||
                processingUpload ||
                publishing
              }
              onClick={scheduleContent}
              type="button"
            >
              <Icon name={scheduled ? "check" : "send"} size={18} />
              {publishing
                ? scheduleMode === "now" ? "Publishing now..." : "Sending to n8n..."
                : scheduled
                  ? scheduleMode === "now" ? "Content published" : "Content scheduled"
                  : scheduleMode === "now"
                    ? `Publish ${mediaFiles.length} item${mediaFiles.length === 1 ? "" : "s"} now`
                    : `Schedule ${mediaFiles.length} content item${mediaFiles.length === 1 ? "" : "s"}`}
            </button>
            <p className={`timezone ${publishError ? "error" : ""}`}>
              {publishError || (scheduleMode === "smart"
                ? editingTimezone ? (
                  <span className="timezone-editor">
                    <select
                      aria-label="Publishing timezone"
                      onChange={(event) => {
                        setSelectedTimezone(event.target.value);
                        setScheduled(false);
                      }}
                      value={selectedTimezone}
                    >
                      {timezoneOptions.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setEditingTimezone(false)} type="button">
                      Done
                    </button>
                  </span>
                ) : (
                  <>
                    Timezone: {selectedTimezone.replaceAll("_", " ")} ·{" "}
                    <button onClick={() => setEditingTimezone(true)} type="button">
                      Change
                    </button>
                  </>
                )
                : "Publishing will begin immediately")}
            </p>
          </aside>
        </div>
        )}
      </main>
      {cropWarning && (
        <div className="crop-warning-backdrop">
          <div
            aria-describedby="crop-warning-message"
            aria-labelledby="crop-warning-title"
            aria-modal="true"
            className="crop-warning-dialog"
            role="alertdialog"
          >
            <h2 id="crop-warning-title">Image may be rejected</h2>
            <p className="crop-warning-files">{cropWarning.fileNames.join(", ")}</p>
            <p id="crop-warning-message">
              The image does not meet the requirement of an aspect ratio between
              4:5 and 1.91:1. Instagram may still reject it with the aspect-ratio
              error. For that file, re-save it as JPEG (or take a screenshot of
              it) before uploading.
            </p>
            <div className="crop-warning-actions">
              <button
                className="crop-warning-reject"
                onClick={() => resolveCropWarning(false)}
                type="button"
              >
                Reject
              </button>
              <button
                autoFocus
                className="crop-warning-accept"
                onClick={() => resolveCropWarning(true)}
                type="button"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
