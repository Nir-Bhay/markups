import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  Cloud,
  Code2,
  Download,
  Eye,
  FileCode,
  FileDown,
  FileText,
  GitBranch,
  HardDrive,
  Minus,
  PenLine,
  Plus,
  Share2,
  UserRound,
} from "lucide-react";
import { Navigation, Footer } from "./components/SiteChrome";
import { ButtonLink, EDITOR_URL, GithubStarLink, REPOSITORY_URL, Reveal, SectionHeading } from "./components/SiteUI";
import { GithubIcon } from "./components/BrandIcons";
import { HeroEditor } from "./components/HeroEditor";
import { WorkspaceDemo } from "./components/WorkspaceDemo";
import { FeatureGrid } from "./components/FeatureGrid";
import { useGithubStars } from "./hooks/useGithubStars";

const proofItems = [
  { icon: UserRound, title: "No account required", text: "Start with a blank draft." },
  { icon: HardDrive, title: "Local-first drafts", text: "Saved in this browser." },
  { icon: FileCode, title: "Open source · MIT", text: "Inspect the project." },
  { icon: FileDown, title: "Markdown stays portable", text: "Export when you choose." },
];

const roadmapItems = [
  {
    icon: Cloud,
    title: "Markups Cloud",
    body: "Appwrite project setup and live security/consent checks are required before this optional text backup can be enabled. No Markups Cloud backup is active in this build.",
  },
  {
    icon: HardDrive,
    title: "Google Drive",
    body: "A manual open/save flow for a separate copy. Google OAuth and Picker setup plus live verification are still required.",
  },
  {
    icon: GitBranch,
    title: "GitHub repositories",
    body: "A manual repository open/commit flow. GitHub App configuration and live permission checks are still required.",
  },
];

const faqs = [
  {
    question: "Is Markups free?",
    answer: "Yes. You can start writing in the browser without an account.",
  },
  {
    question: "Where are my documents saved?",
    answer: "Local documents are saved in this browser. Export or share them when you choose.",
  },
  {
    question: "Does Markups upload my document automatically?",
    answer: "No automatic Markups cloud backup is enabled in this build.",
  },
  {
    question: "Can I share a document?",
    answer: "Yes. You can create a share link or share or download a Markdown file. Anyone with the link can read that document, so treat the link as the document.",
  },
  {
    question: "Which export formats are available?",
    answer: "Markdown, image-based PDF, standalone HTML, plain text, PNG, print, and Word-compatible .doc.",
  },
  {
    question: "Is the Word export a native .docx file?",
    answer: "No. It is Word-compatible HTML saved with a .doc extension, not a native OOXML .docx file.",
  },
  {
    question: "Can I connect Drive or GitHub?",
    answer: "Drive and GitHub workflows exist in the source but are not configured or available to users in this build. When enabled, they are manual and require you to choose a file; they do not run background sync. Local editing does not require a provider connection.",
  },
  {
    question: "How does the AI assistant work?",
    answer: "You configure a supported provider and your own key, then choose an action and the excerpt or document context to send. Requests go to that provider; they are not described as browser-only.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {faqs.map((item, index) => {
        const open = openIndex === index;
        const answerId = `faq-answer-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <article className={`faq-item ${open ? "is-open" : ""}`} key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={answerId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span><i>{String(index + 1).padStart(2, "0")}</i>{item.question}</span>
                <span className="faq-toggle-icon" aria-hidden="true">{open ? <Minus size={19} /> : <Plus size={19} />}</span>
              </button>
            </h3>
            <div
              id={answerId}
              className="faq-answer-wrap"
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!open}
            >
              <div><p>{item.answer}</p></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function App() {
  const stars = useGithubStars();

  return (
    <div className="page-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navigation stars={stars} />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="container-wide hero-layout">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow">FREE <span>·</span> OPEN SOURCE <span>·</span> NO ACCOUNT NEEDED</p>
              <h1 id="hero-title">
                <span className="hero-title-line"><span>Write in Markdown.</span></span>
                <span className="hero-title-line"><span>See the whole picture.</span></span>
              </h1>
              <p className="hero-body">A focused browser editor for ideas that mix words, code, math, and diagrams. Write on one side, see your document take shape on the other, then export or share when you’re ready.</p>
              <div className="hero-actions">
                <ButtonLink href={EDITOR_URL} external icon={<ArrowRight size={18} aria-hidden="true" />}>Open the editor</ButtonLink>
                <ButtonLink href="#workspace" variant="secondary">Explore the workspace</ButtonLink>
              </div>
              <p className="hero-reassurance">Free to use <span>·</span> Your drafts stay in this browser by default <span>·</span> Export whenever you choose</p>
            </div>
            <HeroEditor />
          </div>
        </section>

        <section className="proof-section" aria-label="Practical reasons to trust Markups">
          <div className="container">
            <Reveal>
              <div className="proof-strip">
                {proofItems.map(({ icon: Icon, title, text }) => (
                  <div className="proof-item" key={title}>
                    <Icon size={20} aria-hidden="true" />
                    <div><strong>{title}</strong><span>{text}</span></div>
                  </div>
                ))}
              </div>
              <div className="proof-github-row">
                <span>A community signal, not a customer claim.</span>
                <GithubStarLink stars={stars} label="Star Markups on GitHub" />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section workspace-section" id="workspace" aria-labelledby="workspace-title">
          <div className="container">
            <Reveal>
              <SectionHeading
                id="workspace-title"
                eyebrow="A WRITING WORKSPACE, NOT A FORMAT FIGHT"
                title="From first line to finished document."
                body="Keep your Markdown visible while the rendered page stays close at hand. Switch views when you need room to write, room to review, or both at once."
                align="center"
              />
            </Reveal>
            <Reveal delay={80}>
              <WorkspaceDemo />
            </Reveal>
          </div>
        </section>

        <section className="section features-section" id="features" aria-labelledby="features-title">
          <div className="container">
            <Reveal>
              <SectionHeading
                id="features-title"
                eyebrow="MORE THAN A TEXT BOX"
                title="All the pieces of a good Markdown workflow, together."
                body="Draft, preview, organize, and export without switching between a handful of disconnected tools."
              />
            </Reveal>
            <Reveal delay={70}><FeatureGrid /></Reveal>
          </div>
        </section>

        <section className="section workflow-section" id="how-it-works" aria-labelledby="workflow-title">
          <div className="container">
            <Reveal className="workflow-reveal">
              <div className="workflow-intro">
                <SectionHeading
                  id="workflow-title"
                  eyebrow="FROM ROUGH NOTE TO READY DOCUMENT"
                  title="A thoughtful process for work that matters."
                  body="Keep the original text close, shape a clear document, and choose how it leaves your workspace."
                />
                <div className="workflow-intro-note">
                  <span className="workflow-intro-mark"><Braces size={18} aria-hidden="true" /></span>
                  <span><strong>One document, end to end.</strong><small>Markdown remains yours to edit at every step.</small></span>
                </div>
              </div>
              <div className="workflow-board">
                <article className="workflow-card workflow-capture">
                  <div className="workflow-card-heading"><span>01 <i /> CAPTURE</span><PenLine size={19} aria-hidden="true" /></div>
                  <h3>Begin with the thought.</h3>
                  <p>Write freely in Markdown or use familiar formatting controls to get started.</p>
                  <div className="workflow-capture-preview" aria-hidden="true">
                    <div><span>EXECUTIVE BRIEF</span><span>draft.md</span></div>
                    <code><b>#</b> The next clear step</code>
                    <code><b>##</b> Decisions & owners</code>
                    <code><i>- [x]</i> Align on the goal</code>
                    <code><i>- [ ]</i> Review the plan</code>
                  </div>
                </article>
                <span className="workflow-connector" aria-hidden="true"><ArrowRight size={17} /></span>
                <article className="workflow-card workflow-review">
                  <div className="workflow-card-heading"><span>02 <i /> SHAPE</span><Eye size={19} aria-hidden="true" /></div>
                  <h3>See the structure take shape.</h3>
                  <p>Check the rendered page while the source stays easy to reach.</p>
                  <div className="workflow-review-preview" aria-hidden="true">
                    <div className="workflow-review-toolbar"><i /><i /><i /><span>LIVE PREVIEW</span></div>
                    <div className="workflow-review-page">
                      <span className="workflow-page-kicker">PROJECT BRIEF</span>
                      <strong>A clear next step.</strong>
                      <span className="workflow-page-line is-long" /><span className="workflow-page-line" />
                      <div><b>Workstream</b><b>Next action</b></div>
                      <div><span>Product</span><span>Review scope</span></div>
                      <div><span>Engineering</span><span>Check the API</span></div>
                    </div>
                  </div>
                  <div className="workflow-review-foot"><Check size={15} aria-hidden="true" /> Source stays editable</div>
                </article>
                <span className="workflow-connector" aria-hidden="true"><ArrowRight size={17} /></span>
                <article className="workflow-card workflow-deliver">
                  <div className="workflow-card-heading"><span>03 <i /> DELIVER</span><FileDown size={19} aria-hidden="true" /></div>
                  <h3>Choose where it goes next.</h3>
                  <p>Export or share when you decide. Keep a portable copy of your work.</p>
                  <div className="workflow-deliver-formats" aria-label="Example output formats">
                    <span><FileText size={16} aria-hidden="true" /><b>.md</b><small>Source</small></span>
                    <span><Download size={16} aria-hidden="true" /><b>.pdf</b><small>Visual copy</small></span>
                    <span><Code2 size={16} aria-hidden="true" /><b>.html</b><small>Standalone</small></span>
                  </div>
                </article>
              </div>
              <div className="workflow-endnote" aria-label="Workflow summary">
                <span>Editable Markdown</span><i aria-hidden="true" /><span>Live preview</span><i aria-hidden="true" /><span>Chosen export</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section privacy-section" id="privacy" aria-labelledby="privacy-title">
          <div className="container privacy-layout">
            <Reveal className="privacy-copy">
              <SectionHeading
                id="privacy-title"
                eyebrow="LOCAL FIRST BY DEFAULT"
                title="Your draft begins in your browser."
                body="Open Markups and start writing without creating a Markups account. Local editing and autosave keep your draft in this browser. Export and share actions happen when you choose them."
              />
              <ul className="privacy-facts" id="privacy-details">
                <li><Check size={18} aria-hidden="true" /><span><strong>No account to start writing.</strong></span></li>
                <li><Check size={18} aria-hidden="true" /><span><strong>No automatic Markups cloud upload in the current build.</strong></span></li>
                <li><Share2 size={18} aria-hidden="true" /><span><strong>Sharing creates a link that anyone who receives it can open.</strong> Treat the link as the document.</span></li>
              </ul>
              <div className="privacy-ai-note">
                <Code2 size={18} aria-hidden="true" />
                <p>If you use the AI assistant, the context you choose is sent to the provider configured with your key.</p>
              </div>
              <a className="text-link" href="#privacy-details">Read the privacy details <ArrowRight size={16} aria-hidden="true" /></a>
            </Reveal>
            <Reveal className="data-flow-card" delay={80}>
              <div className="data-flow-heading"><span>YOUR DOCUMENT</span><span className="local-badge"><i /> Local by default</span></div>
              <div className="data-flow-steps">
                <div className="data-flow-step">
                  <span className="data-flow-icon"><PenLine size={23} aria-hidden="true" /></span>
                  <div><strong>Write</strong><p>Start in the editor.</p></div>
                </div>
                <div className="data-flow-connector" aria-hidden="true"><span>then</span></div>
                <div className="data-flow-step">
                  <span className="data-flow-icon"><HardDrive size={23} aria-hidden="true" /></span>
                  <div><strong>Save in this browser</strong><p>Local autosave and history.</p></div>
                </div>
                <div className="data-flow-connector" aria-hidden="true"><span>only when you choose</span></div>
                <div className="data-flow-step is-choice">
                  <span className="data-flow-icon"><Share2 size={23} aria-hidden="true" /></span>
                  <div><strong>Export or share</strong><p>A deliberate action, not an automatic upload.</p></div>
                </div>
              </div>
              <div className="data-flow-note">
                <strong>A network note</strong>
                <p>A first visit needs the network. Cached later visits may work in some conditions, but Markups is not presented as a guaranteed offline tool.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section roadmap-section" id="roadmap" aria-labelledby="roadmap-title">
          <div className="container">
            <Reveal>
              <div className="roadmap-status"><span aria-hidden="true" />OPTIONAL CONNECTIONS — SETUP REQUIRED</div>
              <SectionHeading
                id="roadmap-title"
                title="A careful, opt-in direction for connected documents."
                body="These optional account and provider flows need project configuration and live verification before they are available to users. Local editing does not require a connection."
              />
              <div className="roadmap-grid">
                {roadmapItems.map(({ icon: Icon, title, body }) => (
                  <article key={title}>
                    <div className="roadmap-card-top"><span className="roadmap-icon"><Icon size={21} aria-hidden="true" /></span><span className="planned-label">Setup pending</span></div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                    <span className="not-live-label">Unavailable until setup and verification</span>
                  </article>
                ))}
              </div>
              <div className="roadmap-guardrails">
                <strong>Before any cloud pilot is enabled</strong>
                <span>Explicit quotas</span><span>Per-document consent</span><span>Recovery controls</span><span>Deletion controls</span>
                <p>No automatic sync, cloud collaboration, or cloud attachment backup is promised.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section open-source-section" id="open-source" aria-labelledby="open-source-title">
          <div className="container open-source-layout">
            <Reveal>
              <SectionHeading
                id="open-source-title"
                eyebrow="OPEN SOURCE · MIT LICENSE"
                title="Built in the open. Useful by design."
                body="Inspect the implementation, follow the project, or bring a thoughtful issue to the repository."
                align="center"
              />
              <div className="repository-card">
                <div className="repository-card-heading">
                  <span className="repository-icon"><GithubIcon size={27} aria-hidden="true" /></span>
                  <div><span>PUBLIC REPOSITORY</span><h3>Nir-Bhay / markups</h3></div>
                  <span className="repository-license">MIT</span>
                </div>
                <p>A browser-based Markdown editor for writing, previewing, organizing, and exporting structured documents.</p>
                <div className="repository-meta"><span><i className="language-dot" />Browser editor</span><span><FileCode size={15} aria-hidden="true" />MIT license</span><span><GitBranch size={15} aria-hidden="true" />Public source</span></div>
                <div className="repository-actions">
                  <ButtonLink href={REPOSITORY_URL} external icon={<GithubIcon size={18} aria-hidden="true" />}>Explore Markups on GitHub</ButtonLink>
                  <GithubStarLink stars={stars} label="Star this project" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section use-cases-section" aria-labelledby="use-cases-title">
          <div className="container">
            <Reveal>
              <SectionHeading
                id="use-cases-title"
                className="use-cases-heading"
                eyebrow="ONE FLEXIBLE MARKDOWN WORKSPACE"
                title="From rough notes to work ready to share."
                body="Plan a release, connect ideas to evidence, or shape a guide. Keep every draft readable, structured, and portable."
              />
              <div className="use-case-grid">
                <article className="use-case-card use-case-card-engineering">
                  <div className="use-case-card-topline"><span>01 <i /> ENGINEERING & PRODUCT</span><FileCode size={18} aria-hidden="true" /></div>
                  <div className="use-case-card-copy">
                    <h3>Make the next move obvious.</h3>
                    <p>Turn a product decision into a clear brief the whole team can act on.</p>
                  </div>
                  <div className="project-brief-art use-case-showcase" aria-hidden="true">
                    <div className="showcase-window-bar">
                      <span><FileCode size={13} /> launch-brief.md</span>
                      <span className="showcase-status"><i /> IN REVIEW</span>
                    </div>
                    <div className="project-brief-title">
                      <span>PRODUCT DECISION</span>
                      <strong>Onboarding refresh</strong>
                      <p>Make the first draft feel simple.</p>
                    </div>
                    <div className="project-brief-details">
                      <div><span>DECISION</span><strong>One clear path</strong></div>
                      <div><span>OWNER</span><strong>Product team</strong></div>
                    </div>
                    <div className="project-brief-next"><span>Next step</span><strong>Review the new flow</strong><ArrowRight size={14} /></div>
                  </div>
                </article>
                <article className="use-case-card use-case-card-research">
                  <div className="use-case-card-topline"><span>02 <i /> LEARNING & RESEARCH</span><BookOpen size={18} aria-hidden="true" /></div>
                  <div className="use-case-card-copy">
                    <h3>Keep evidence close to the idea.</h3>
                    <p>Bring a question, your source notes, and the takeaway into one readable page.</p>
                  </div>
                  <div className="research-board-art use-case-showcase" aria-hidden="true">
                    <div className="showcase-window-bar">
                      <span><BookOpen size={13} /> field-notes.md</span>
                      <span className="showcase-tag">SAMPLE NOTE</span>
                    </div>
                    <div className="research-question"><span>QUESTION</span><strong>How do teams keep decisions visible?</strong></div>
                    <div className="research-evidence-list">
                      <div><i>01</i><span><b>OBSERVATION</b><strong>Short notes are easier to revisit.</strong></span><Check size={13} /></div>
                      <div><i>02</i><span><b>SOURCE</b><strong>Team interview · meeting notes</strong></span><ArrowRight size={13} /></div>
                    </div>
                    <div className="research-takeaway"><span>TAKEAWAY</span><strong>Write down the why while it is still fresh.</strong></div>
                  </div>
                </article>
                <article className="use-case-card use-case-card-writing">
                  <div className="use-case-card-topline"><span>03 <i /> TECHNICAL WRITING</span><FileText size={18} aria-hidden="true" /></div>
                  <div className="use-case-card-copy">
                    <h3>Give every guide a polished finish.</h3>
                    <p>Shape a scannable document, then keep it editable for the next update.</p>
                  </div>
                  <div className="guide-document-art use-case-showcase" aria-hidden="true">
                    <div className="showcase-window-bar">
                      <span><FileText size={13} /> release-guide.md</span>
                      <span className="showcase-tag">PREVIEW</span>
                    </div>
                    <div className="guide-document-page">
                      <span className="guide-document-kicker">GETTING STARTED</span>
                      <strong>Ship a clean release</strong>
                      <p>A short path from finished changes to a confident launch.</p>
                      <div className="guide-document-steps">
                        <span><i>01</i><b>Prepare</b></span>
                        <span><i>02</i><b>Review</b></span>
                        <span><i>03</i><b>Publish</b></span>
                      </div>
                      <div className="guide-document-callout"><b>NOTE</b><span>Keep each step short and clear.</span></div>
                    </div>
                    <div className="guide-document-footer"><span><Check size={12} /> Markdown stays editable</span><span><Download size={12} /> Export guide</span></div>
                  </div>
                </article>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section guides-section" id="guides" aria-labelledby="guides-title">
          <div className="container">
            <Reveal>
              <SectionHeading
                id="guides-title"
                eyebrow="PRACTICAL MARKDOWN GUIDES"
                title="Keep going with a worked example."
                body="Use a focused guide when you want to learn a format, see a real example, or follow an export workflow."
              />
              <div className="guide-links">
                <a href="/seo/cheatsheet"><span>REFERENCE</span><strong>Markdown cheatsheet</strong><ArrowRight size={17} aria-hidden="true" /></a>
                <a href="/seo/markdown-live-preview-editor"><span>WORKFLOW</span><strong>Live Markdown preview</strong><ArrowRight size={17} aria-hidden="true" /></a>
                <a href="/seo/examples/mermaid"><span>DIAGRAMS</span><strong>Mermaid examples</strong><ArrowRight size={17} aria-hidden="true" /></a>
                <a href="/seo/examples/math"><span>EQUATIONS</span><strong>Math in Markdown</strong><ArrowRight size={17} aria-hidden="true" /></a>
                <a href="/seo/markdown-to-html"><span>EXPORT</span><strong>Markdown to HTML</strong><ArrowRight size={17} aria-hidden="true" /></a>
                <a href="/seo/tutorials/markdown-to-pdf"><span>TUTORIAL</span><strong>Markdown to PDF</strong><ArrowRight size={17} aria-hidden="true" /></a>
              </div>
              <a className="text-link guide-lab-link" href="/seo/compatibility-lab">Try the Markdown Compatibility Lab <ArrowRight size={16} aria-hidden="true" /></a>
            </Reveal>
          </div>
        </section>

<section className="section guides-section" id="blog" aria-labelledby="blog-title"><div className="container"><SectionHeading id="blog-title" eyebrow="THE MARKUPS BLOG" title="Practical Markdown for your next draft." body="Templates and guides for coding agents, documentation, diagrams, and everyday writing." /><div className="guide-links"><a href="/blog/github-readme-template"><span>DOCUMENTATION</span><strong>Write a useful README</strong></a><a href="/blog/markdown-instructions-for-coding-agents"><span>CODING AGENTS</span><strong>Build an AGENTS.md guide</strong></a><a href="/blog/architecture-decision-records-markdown-template"><span>ENGINEERING</span><strong>Record architecture decisions</strong></a></div><a className="text-link guide-lab-link" href="/blog">Explore all articles</a><a className="text-link guide-lab-link" href="/markdown-guide">Read the complete Markdown guide</a></div></section>
        <section className="section faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container faq-layout">
            <Reveal className="faq-heading-column">
              <SectionHeading
                id="faq-title"
                eyebrow="THE PRACTICAL DETAILS"
                title="Questions, answered plainly."
                body="The current local workflow, the optional assistant, and what still needs setup and verification—without fine-print surprises."
              />
              <a className="text-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">Inspect the project on GitHub <ArrowRight size={16} aria-hidden="true" /></a>
            </Reveal>
            <Reveal delay={60}><FAQSection /></Reveal>
          </div>
        </section>

        <section className="section final-cta-section" aria-labelledby="final-cta-title">
          <div className="container">
            <Reveal>
              <div className="final-cta-panel">
                <div className="final-cta-decoration" aria-hidden="true">
                  <span># A new draft</span><i /><i /><i /><b>→</b><strong>A clear document</strong>
                </div>
                <div className="final-cta-content">
                  <p className="eyebrow">YOUR NEXT DRAFT CAN START HERE</p>
                  <h2 id="final-cta-title">Make room for the next good idea.</h2>
                  <p>Open a draft, bring your Markdown, and see it take shape. No account needed.</p>
                  <div className="final-cta-actions">
                    <ButtonLink href={EDITOR_URL} external icon={<ArrowRight size={18} aria-hidden="true" />}>Open the editor</ButtonLink>
                    <ButtonLink href={REPOSITORY_URL} variant="secondary" external icon={<GithubIcon size={18} aria-hidden="true" />}>Browse the source on GitHub</ButtonLink>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer stars={stars} />
    </div>
  );
}
