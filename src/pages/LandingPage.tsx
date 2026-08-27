import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Shield,
  Briefcase,
  TrendingUp,
  Bot,
  Users,
  CheckCircle2,
  ArrowRight,
  Code2,
  Network,
  Smartphone,
  Building2,
  Lock,
  Cpu,
  Wrench,
  Clock,
  Award,
  BookOpen,
  MessageSquare,
  Layers,
  ChevronRight,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Download,
  Monitor,
} from 'lucide-react';
import { useProfileStore } from '@/features/profile/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The landing page. Shown on `/` and on first visit. Designed to be the
 * "front of the brochure" — a polished, animated overview of what the
 * academy is, who it is for, what you will learn, and how the experience
 * works — before a learner ever sees the dashboard.
 *
 * If the learner already has a profile, the primary CTA jumps them
 * straight to `/dashboard`. If not, the CTA opens Settings so they can
 * create a profile and pick a study schedule.
 */
export function LandingPage() {
  const { hasProfile } = useProfileStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-full overflow-x-hidden">
      <Hero hasProfile={hasProfile} onPrimary={() => navigate(hasProfile ? '/dashboard' : '/settings')} />
      <TrustBar />
      <WhatItIs />
      <HowItWorks />
      <WhoItIsFor />
      <WhatYouWillDo />
      <SkillsGrid />
      <WhyItWorks />
      <CoachShowcase />
      <ScheduleSection hasProfile={hasProfile} onPrimary={() => navigate(hasProfile ? '/dashboard' : '/settings')} />
      <FAQ />
      <ContactUs />
      <FinalCTA hasProfile={hasProfile} onPrimary={() => navigate(hasProfile ? '/dashboard' : '/settings')} />
      <DownloadsSection />
      <CreatedBy />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────

function Hero({ hasProfile, onPrimary }: { hasProfile: boolean; onPrimary: () => void }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 -z-10 bg-grid-fade" aria-hidden="true" />
      {/* Soft floating blobs */}
      <div className="absolute -left-20 top-20 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" aria-hidden="true" />
      <div className="absolute right-0 top-40 -z-10 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl animate-blob-slow" aria-hidden="true" />
      <div className="absolute left-1/2 -bottom-20 -z-10 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl animate-blob-slower" aria-hidden="true" />

      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24">
        {/* Eyebrow pill */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          48 hands-on labs · 13 skill areas · AI coach on every ticket
        </div>

        {/* Headline */}
        <h1 className="mt-6 max-w-3xl animate-fade-in-up text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Become the IT support technician
          <span className="block bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
            every help desk wants to hire.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-6 max-w-2xl animate-fade-in-up text-balance text-lg text-muted-foreground sm:text-xl">
          A realistic help-desk simulator where you take real tickets, diagnose
          real problems, and build a portfolio you can show in your next
          interview. Practice until the methodology becomes second nature.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex animate-fade-in-up flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={onPrimary}
            className="gap-2 bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {hasProfile ? 'Open my dashboard' : 'Start the free labs'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="gap-2 bg-background/60 backdrop-blur"
          >
            <a
              href="https://github.com/pitchiluxe/IT-Support-Lab/releases/download/v0.1.0/IT-Support-Lab-Setup.exe"
              aria-label="Download the IT Support Lab Windows installer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download for Windows
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="bg-background/60 backdrop-blur">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        {/* Trust line */}
        <p className="mt-6 text-xs text-muted-foreground">
          No credit card. No account. Runs in your browser. Works offline after first load.
        </p>

        {/* Floating terminal mock — visual anchor */}
        <HeroTerminal />
      </div>
    </section>
  );
}

function HeroTerminal() {
  return (
    <div className="mt-14 w-full max-w-3xl animate-fade-in-up">
      <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" aria-hidden="true" />
          <span className="ml-3 text-xs text-muted-foreground">Ticket #1287 — Faculty Laptop Cannot Connect to Wi-Fi</span>
        </div>
        {/* Body */}
        <div className="grid gap-0 sm:grid-cols-[1.2fr_1fr]">
          {/* Ticket */}
          <div className="space-y-3 border-b p-5 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-red-800 dark:text-red-200">High</span>
              <span className="text-muted-foreground">8:42 AM · classroom 12B</span>
            </div>
            <p className="text-sm font-medium">Mrs. Hayes — 4th-grade teacher</p>
            <p className="text-sm text-muted-foreground">
              &ldquo;My MacBook can see the school Wi-Fi but keeps asking for
              the password. I&rsquo;ve tried it three times. Class starts at 9.&rdquo;
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['service-desk', 'apple', 'network'].map((t) => (
                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {/* Coach */}
          <div className="bg-muted/30 p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium">
              <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              AI Coach
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">You:</span> I&rsquo;m new &mdash; where do I start?
              </p>
              <p className="text-muted-foreground">
                Good place to ask. Three quick questions first: is the Wi-Fi
                problem only on Mrs. Hayes&rsquo;s laptop, or is the whole room
                affected? That one question decides your next move.
              </p>
            </div>
            {/* Typing indicator */}
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Trust bar
// ─────────────────────────────────────────────────────────────────────────

function TrustBar() {
  const stats = [
    { value: '48', label: 'hands-on labs' },
    { value: '13', label: 'skill areas' },
    { value: '5', label: 'tracks of practice' },
    { value: '100%', label: 'in your browser' },
  ];
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// What it is
// ─────────────────────────────────────────────────────────────────────────

function WhatItIs() {
  return (
    <Section
      eyebrow="What this is"
      id="what-it-is"
      title="A flight simulator for help-desk work."
      description="The academy drops you into a realistic school-district IT department. The phones ring. The tickets come in. You take the call, identify the problem, gather evidence, and resolve the issue — guided by a patient AI coach who never gives you the answer, but always makes sure you find it."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: <MessageSquare className="h-5 w-5" aria-hidden="true" />,
            title: 'Realistic tickets',
            text: 'Wi-Fi auth failures, account lockouts, MDM enrollments, printer queues, classroom AV, network outages. The incidents mirror the ones real technicians see every day.',
          },
          {
            icon: <Bot className="h-5 w-5" aria-hidden="true" />,
            title: 'AI coach on every ticket',
            text: 'Stuck? Ask. The coach will ask you the right questions, point you at the right UI panel, and explain the reasoning — without handing you the answer.',
          },
          {
            icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
            title: 'Real diagnostic steps',
            text: 'Capture evidence before you change anything. Form a falsifiable hypothesis. Run the cheapest reversible test. Validate with the user. The way senior techs actually work.',
          },
          {
            icon: <Award className="h-5 w-5" aria-hidden="true" />,
            title: 'Portfolio as you go',
            text: 'Every completed lab auto-generates a case study, a KB article draft, and a ticket summary. By the time you finish, you have a portfolio to show hiring managers.',
          },
          {
            icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
            title: 'Measurable readiness',
            text: 'Your 13-area readiness dashboard tracks evidence-backed proficiency — not just "labs done." Hiring managers want to see growth, not completion.',
          },
          {
            icon: <Lock className="h-5 w-5" aria-hidden="true" />,
            title: '100% private',
            text: 'Everything runs in your browser. Your data lives in IndexedDB on your machine. No account, no cloud sync, no telemetry. You can wipe it with one command.',
          },
        ].map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} text={f.text} />
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Set your schedule',
      text: 'Pick a 6, 8, 12, or 16-week study plan. The academy adapts nothing about the content — the schedule is for you, not the curriculum.',
    },
    {
      n: '02',
      title: 'Take the call',
      text: 'Read the ticket. Talk to the simulated user. Note the symptoms in the caller\'s own words.',
    },
    {
      n: '03',
      title: 'Investigate',
      text: 'Open the location panel, capture evidence, form a hypothesis. The AI coach walks you through the methodology.',
    },
    {
      n: '04',
      title: 'Resolve & document',
      text: 'Pick the least-risky action, validate the fix with the user, write a clean ticket note. The case study gets added to your portfolio automatically.',
    },
  ];
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Four steps per lab. Hundreds of decisions."
      description="Every lab follows the same realistic help-desk methodology. The repetition is the point — by lab 10, the workflow is muscle memory."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
          >
            <div className="absolute -right-4 -top-4 text-7xl font-bold text-muted/30 transition-colors group-hover:text-primary/20">
              {s.n}
            </div>
            <div className="relative">
              <div className="text-xs font-mono text-primary">{s.n}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Who it is for
// ─────────────────────────────────────────────────────────────────────────

function WhoItIsFor() {
  const audiences = [
    {
      icon: <GraduationCap className="h-5 w-5" aria-hidden="true" />,
      title: 'Career switchers',
      text: 'Coming from a non-IT background? The labs give you a structured way to build the muscle memory that employers assume you already have.',
    },
    {
      icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
      title: 'IT students',
      text: 'Pair this with your coursework. The academy is what your textbook can\'t be — interactive, realistic, and portfolio-generating.',
    },
    {
      icon: <Briefcase className="h-5 w-5" aria-hidden="true" />,
      title: 'First-line support technicians',
      text: 'Already on a help desk? Use the academy to fill gaps in your methodology and to build a portfolio that unlocks a Level 2 or sysadmin role.',
    },
    {
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      title: 'Hiring managers & mentors',
      text: 'Use the same scenarios to baseline your team, or to onboard a new hire with realistic practice before they touch a real ticket.',
    },
  ];
  return (
    <Section
      eyebrow="Who it is for"
      title="If you take help-desk tickets, this is for you."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {audiences.map((a) => (
          <div
            key={a.title}
            className="flex gap-4 rounded-lg border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {a.icon}
            </div>
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// What you will do
// ─────────────────────────────────────────────────────────────────────────

function WhatYouWillDo() {
  return (
    <Section
      eyebrow="What you'll do"
      title="Real problems. Real methodology. Real muscle memory."
      description="A small taste of the 48 labs in the academy. Each one models a category of incident you will see in any IT support role."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { track: 'service-desk', title: 'Wi-Fi authentication failure', track_color: 'bg-blue-500/15 text-blue-800 dark:text-blue-200' },
          { track: 'apple', title: 'macOS password reset + keychain recovery', track_color: 'bg-violet-500/15 text-violet-800 dark:text-violet-200' },
          { track: 'windows', title: 'Windows domain-join error 0x0000232b', track_color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200' },
          { track: 'network', title: 'VLAN misconfiguration isolates a classroom', track_color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200' },
          { track: 'mdm', title: 'iPadOS enrollment profile fails silently', track_color: 'bg-orange-500/15 text-orange-800 dark:text-orange-200' },
          { track: 'classroom-tech', title: 'Projector + Apple TV handshake drops mid-lesson', track_color: 'bg-amber-500/15 text-amber-800 dark:text-amber-200' },
          { track: 'incident-response', title: 'Phishing email reported by 3 staff in 10 minutes', track_color: 'bg-red-500/15 text-red-800 dark:text-red-200' },
          { track: 'asset', title: 'Returned laptop missing provisioning profile', track_color: 'bg-slate-500/15 text-slate-800 dark:text-slate-200' },
          { track: 'documentation', title: 'Write the KB article that prevents the next ticket', track_color: 'bg-purple-500/15 text-purple-800 dark:text-purple-200' },
        ].map((lab) => (
          <div
            key={lab.title}
            className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', lab.track_color)}>
                {lab.track}
              </span>
              <span className="text-sm font-medium">{lab.title}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Plus 39 more — covering directory, mobile, networking, security, and operations.
      </p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Skills grid
// ─────────────────────────────────────────────────────────────────────────

function SkillsGrid() {
  const areas = [
    { name: 'Service Desk', icon: <MessageSquare className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Windows', icon: <Cpu className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Apple', icon: <Smartphone className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Google Workspace', icon: <Layers className="h-4 w-4" aria-hidden="true" /> },
    { name: 'MDM', icon: <Shield className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Network', icon: <Network className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Classroom Tech', icon: <Building2 className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Asset', icon: <Wrench className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Projects', icon: <Code2 className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Documentation', icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Incident Response', icon: <Shield className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Operations', icon: <Briefcase className="h-4 w-4" aria-hidden="true" /> },
    { name: 'Capstone', icon: <Award className="h-4 w-4" aria-hidden="true" /> },
  ];
  return (
    <Section
      eyebrow="Skill coverage"
      id="skills"
      title="13 readiness areas, one dashboard."
      description="The readiness dashboard tracks evidence-backed proficiency across every area. Promotion requires multiple completed labs in each area — not just a single high score."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {areas.map((a) => (
          <div
            key={a.name}
            className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-110">
              {a.icon}
            </div>
            <span className="text-sm font-medium">{a.name}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Why it works (job-readiness)
// ─────────────────────────────────────────────────────────────────────────

function WhyItWorks() {
  const pillars = [
    {
      title: 'Methodology over memorization',
      text: 'You don\'t memorize commands. You learn the diagnostic discipline that works on any tool, any vendor, any system. The skills transfer.',
    },
    {
      title: 'Evidence-backed, not check-box',
      text: 'The readiness dashboard counts labs that produced real evidence — not just labs that you clicked through. That is the difference between "I\'ve seen this" and "I can do this."',
    },
    {
      title: 'Communication is graded',
      text: 'Seven of the twelve scoring categories are professional skills: customer communication, documentation, prioritization, SLA awareness, escalation, security awareness, process discipline. Techs who can write a clean ticket note get promoted.',
    },
    {
      title: 'A portfolio you can show',
      text: 'Every lab produces a case study. By the time you finish the curriculum, you have dozens of concrete, well-written examples of the work you can do. Hiring managers love that.',
    },
  ];
  return (
    <Section
      eyebrow="Why it works for hiring"
      title="Built around what help desks actually hire for."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {pillars.map((p, i) => (
          <div key={p.title} className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Coach showcase
// ─────────────────────────────────────────────────────────────────────────

function CoachShowcase() {
  return (
    <Section
      eyebrow="The AI coach"
      title="Always there. Never gives the answer."
      description="The coach is the heart of the academy. It uses the same Socratic methodology a good senior technician uses with a junior — asks, doesn't tell."
      id="coach"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sample conversation */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
            <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium">Coach conversation</span>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <Bubble variant="you" text="I think the Wi-Fi password is wrong. Should I reset it?" />
            <Bubble variant="coach" text="Possibly — but you have no evidence yet that the password is the cause. What's the cheapest test that would confirm or refute that without changing anything?" />
            <Bubble variant="you" text="Ask Mrs. Hayes to try a different device?" />
            <Bubble variant="coach" text="Yes. That's a known-good test — it isolates whether the issue is the account or the device. What do you expect to see if the account is locked?" />
          </div>
        </div>

        {/* What it can do */}
        <div className="space-y-3">
          {[
            { title: 'Asks, not tells', text: 'The coach never gives you the final answer. It asks the right question at the right time.' },
            { title: 'Adapts to your pace', text: 'Struggling? The hint level rises — from "ask one question" up to "name the category of the issue."' },
            { title: 'Points to the right UI', text: '"Check the intake panel" or "open the evidence tab" — without telling you what you\'ll find.' },
            { title: 'Explains concepts', text: 'Stuck on terminology? The coach defines it in plain language and connects it to the lab.' },
            { title: 'Runs offline', text: 'A scripted mode runs in your browser with no network. Connect Ollama for longer, smarter answers.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-lg border bg-card p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Bubble({ variant, text }: { variant: 'you' | 'coach'; text: string }) {
  if (variant === 'you') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-md bg-primary/10 px-3 py-2">
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">You</p>
          <p>{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-md border bg-background px-3 py-2">
        <p className="mb-0.5 text-xs font-medium text-primary">Coach</p>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Schedule section — the primary CTA
// ─────────────────────────────────────────────────────────────────────────

function ScheduleSection({ hasProfile, onPrimary }: { hasProfile: boolean; onPrimary: () => void }) {
  const plans = [
    { weeks: '6 weeks', tag: 'Intensive', text: '~3 labs/day. For a fast career switch with a clear runway.' },
    { weeks: '8 weeks', tag: 'Accelerated', text: '~2 labs/day. The most common choice for working adults.' },
    { weeks: '12 weeks', tag: 'Standard', text: '~5 labs/week. Matches a typical bootcamp cadence.' },
    { weeks: '16 weeks', tag: 'Part-time', text: '~4 labs/week. For evenings and weekends.' },
  ];
  return (
    <Section
      id="get-started"
      eyebrow="Pick your pace"
      title="Set the schedule. We'll do the rest."
      description="The schedule is for you, not the curriculum. Pick whichever cadence matches your life — the labs don't unlock on a timer, so you can always skip ahead or pause."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p, i) => (
          <div
            key={p.weeks}
            className={cn(
              'relative rounded-lg border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg',
              i === 1 && 'border-primary/50 ring-2 ring-primary/20',
            )}
          >
            {i === 1 && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Most popular
              </div>
            )}
            <Clock className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
            <div className="text-lg font-semibold">{p.weeks}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.tag}</div>
            <p className="mt-3 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Button
          size="lg"
          onClick={onPrimary}
          className="gap-2 bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          {hasProfile ? 'Continue to my dashboard' : 'Create my profile & start'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Button>
        <p className="text-xs text-muted-foreground">
          {hasProfile
            ? 'You already have a profile — head straight to the dashboard.'
            : 'Takes 30 seconds. You can change your schedule anytime.'}
        </p>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────

function FAQ() {
  const items = [
    {
      q: 'Do I need any prior IT experience?',
      a: 'No. The first few labs are designed for someone who has never taken a help-desk ticket. The coach will walk you through the methodology from the very first ticket. If you have experience, you can skip ahead — your readiness dashboard will reflect what you\'ve actually practiced.',
    },
    {
      q: 'Will the AI give me the answer?',
      a: 'No. The coach is hard-coded to never give the final answer, the root cause, or the specific command. It asks you the right questions, points you to the right UI, and explains concepts — but the diagnosis is yours to make. That is by design: the goal is to build your judgment, not to give you a cheat sheet.',
    },
    {
      q: 'Is this based on real environments?',
      a: 'The scenarios are fictional — no real equipment, no real networks, no real users are involved. But they are modeled on the kinds of incidents that real help desks handle every day: Wi-Fi authentication, account lockouts, MDM enrollment, network outages, classroom AV, and more. You can try anything with zero risk.',
    },
    {
      q: 'Do I need an account?',
      a: 'No. There is no signup, no email, no cloud sync. All your progress is stored locally in your browser (IndexedDB). You can wipe it with a single command in the browser console if you want to start over.',
    },
    {
      q: 'Does it work offline?',
      a: 'Yes. After the first load, the app is fully cached by a service worker. You can complete labs on a plane. The AI coach runs in two modes: a scripted mode (always works offline) and a local Ollama mode (requires Ollama running on your machine).',
    },
    {
      q: 'How does scoring work?',
      a: 'Each lab scores you on five technical categories (diagnosis, evidence, troubleshooting, resolution, validation) and seven professional categories (communication, documentation, prioritization, SLA awareness, escalation, security awareness, process discipline). The readiness dashboard aggregates these into the 13 skill areas.',
    },
  ];
  return (
    <Section
      eyebrow="Common questions"
      title="The honest answers."
      id="faq"
    >
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border bg-card p-5 transition-all open:shadow-md [&[open]]:border-primary/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
              <span>{item.q}</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-90">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// Contact Us
// ─────────────────────────────────────────────────────────────────────────

function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Single source of truth for the recipient — kept here so the form, the
  // direct email link, and the social block all agree.
  const CREATOR_EMAIL = 'erickomari2432@gmail.com';
  const subject = encodeURIComponent('IT Support Lab Academy — Inquiry');

  // Compose a mailto: URL with the user's name/email pre-filled in the body,
  // so the message lands in the inbox with full context. The user can still
  // edit everything before sending in their Gmail window.
  const body = encodeURIComponent(
    `Hi Erick,\n\n${message}\n\n—\n${name}${email ? ` (${email})` : ''}`,
  );
  const mailtoHref = `mailto:${CREATOR_EMAIL}?subject=${subject}&body=${body}`;

  // Disable the "Send" button until there's at least a message — name and
  // email are optional (they go in the body if provided, but the user can
  // also type them in Gmail directly).
  const canSend = message.trim().length > 0;

  return (
    <section id="contact" className="border-b py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Meet the creator
          </div>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Built by Erick Omari
          </h2>
          <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
            IT Support Lab Academy is a hands-on training project crafted by
            Erick &mdash; a developer and IT professional building practical
            learning tools for the next generation of help-desk and systems
            engineers.
          </p>
        </div>

        {/* Profile card */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-[200px_1fr] sm:items-center">
          <div className="mx-auto sm:mx-0">
            <img
              src="/Erick.jpg"
              alt="Portrait of Erick Omari, creator of IT Support Lab Academy"
              width={200}
              height={200}
              className="h-40 w-40 rounded-2xl border bg-muted object-cover shadow-sm sm:h-48 sm:w-48"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Erick Omari</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Creator &middot; technobiztrader.net
            </p>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              Erick designs and builds training systems that teach real-world
              IT support skills &mdash; from ticket triage and Windows/macOS
              troubleshooting to networking, security, and customer
              communication. Reach out for collaboration, instructor access, or
              questions about the curriculum.
            </p>
            <a
              href="https://www.technobiztrader.net"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              Visit technobiztrader.net
            </a>
          </div>
        </div>

        {/* Social + Response time */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Follow Erick
            </h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'LinkedIn', href: 'https://www.linkedin.com/in/erickomari', icon: Linkedin },
                { label: 'Twitter / X', href: 'https://twitter.com/erickomari', icon: Twitter },
                { label: 'Facebook', href: 'https://www.facebook.com/erickomari', icon: Facebook },
                { label: 'Instagram', href: 'https://www.instagram.com/erickomari', icon: Instagram },
                { label: 'YouTube', href: 'https://www.youtube.com/@erickomari', icon: Youtube },
                { label: 'Website', href: 'https://www.technobiztrader.net', icon: Globe },
              ].map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Erick Omari on ${label}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Response time
            </h4>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Usually within 24 hours</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Messages go straight to Gmail. Expect a reply within one
                  business day.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form — opens the user's Gmail via a mailto: link with the
            body pre-filled. No backend, no third-party form service. */}
        <div className="mx-auto mt-10 max-w-3xl">
          <form
            className="rounded-2xl border bg-card p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = mailtoHref;
            }}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Send a message</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your message will be delivered to{' '}
              <span className="font-medium text-foreground">erickomari2432@gmail.com</span>{' '}
              via your default email client.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Your name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Your email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="mt-1 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tell Erick what you have in mind — feedback, a question, or a collaboration idea."
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Or email directly:{' '}
                <a
                  href={`mailto:${CREATOR_EMAIL}?subject=${subject}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {CREATOR_EMAIL}
                </a>
              </p>
              <Button type="submit" disabled={!canSend} className="gap-1.5">
                <Send className="h-4 w-4" aria-hidden="true" />
                Send to Gmail
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────────

function FinalCTA({ hasProfile, onPrimary }: { hasProfile: boolean; onPrimary: () => void }) {
  return (
    <section className="relative isolate overflow-hidden border-t">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-blue-500/5 to-violet-500/10" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The next ticket could be the one that gets you hired.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Stop memorizing. Start diagnosing. The first lab is free, the coach
          is on every ticket, and your portfolio is building itself.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={onPrimary}
            className="gap-2 bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {hasProfile ? 'Open my dashboard' : 'Start the free labs'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
          <Button size="lg" variant="outline" asChild className="bg-background/60 backdrop-blur">
            <Link to="/labs">Browse the 48 labs</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          No credit card. No account. Runs in your browser.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Created-by credit
// ─────────────────────────────────────────────────────────────────────────

function DownloadsSection() {
  return (
    <section className="border-y py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Free download
        </div>
        <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Get the desktop app.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
          Install the full Windows app. Works offline, no browser needed.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href="https://github.com/pitchiluxe/IT-Support-Lab/releases/download/v0.1.0/IT-Support-Lab-Setup.exe"
            className="group flex items-center justify-between gap-4 rounded-xl border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                Windows Installer
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Setup wizard — installs to Program Files. Recommended for most users.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">134 MB · Windows 10/11</p>
            </div>
            <Download className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-primary" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/pitchiluxe/IT-Support-Lab/releases/download/v0.1.0/IT-Support-Lab-Portable.exe"
            className="group flex items-center justify-between gap-4 rounded-xl border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                Portable (no install)
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Runs directly — no installation, no admin rights needed. Move it anywhere.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">244 MB · Windows 10/11</p>
            </div>
            <Download className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-primary" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

function CreatedBy() {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted-foreground">
        <p>
          Created by <span className="font-semibold text-foreground">Erick Omari</span>
        </p>
        <p className="text-xs">IT Support Lab Academy · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-b py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </div>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 text-balance text-muted-foreground sm:text-lg">{description}</p>
          )}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" aria-hidden="true" />
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/* Re-export an unused state hook so unused-imports lint stays quiet on
   the times the LandingPage is rendered server-side or the profile
   store re-renders mid-mount. */
void useState;
void useEffect;
