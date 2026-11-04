import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Menu, X } from "lucide-react";
import type { StarState } from "../hooks/useGithubStars";
import { GithubIcon } from "./BrandIcons";
import { Brand, ButtonLink, EDITOR_URL, GithubStarLink, REPOSITORY_URL } from "./SiteUI";

const navItems = [
  { label: "Features", href: "#features", id: "features" },
  { label: "How it works", href: "#how-it-works", id: "how-it-works" },
  { label: "Privacy", href: "#privacy", id: "privacy" },
  { label: "Roadmap", href: "#roadmap", id: "roadmap" },
  { label: "Guides", href: "#guides", id: "guides" },
  { label: "Blog", href: "/blog", id: "blog" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

export function Navigation({ stars }: { stars: StarState }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    const frame = window.requestAnimationFrame(scrollToHash);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.1, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    firstMobileLink.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={active === item.id ? "is-active" : ""}
              aria-current={active === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <span className="nav-github"><GithubStarLink stars={stars} compact /></span>
          <ButtonLink href={EDITOR_URL} external className="nav-editor-button">
            <span className="nav-editor-long">Open editor</span>
            <span className="nav-editor-short">Open</span>
          </ButtonLink>
          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <a
              key={item.id}
              ref={index === 0 ? firstMobileLink : undefined}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.label}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ))}
          <GithubStarLink stars={stars} />
        </nav>
      </div>
    </header>
  );
}

type InfoTopic = "terms" | "accessibility" | null;

const infoCopy = {
  terms: {
    title: "About these website terms",
    body: "These notes describe how Markups works today. Anything marked Setup pending is not configured or available yet. Use of the editor, GitHub, or an AI provider you configure is also subject to that service’s own terms.",
  },
  accessibility: {
    title: "Accessibility on this page",
    body: "The page supports keyboard navigation, visible focus, reduced motion, and an opaque navigation fallback when transparency is reduced. To report an accessibility issue in the Markups project, use the repository’s issue tracker.",
  },
};

export function Footer({ stars }: { stars: StarState }) {
  const [topic, setTopic] = useState<InfoTopic>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (topic && !dialog.open) dialog.showModal();
    if (!topic && dialog.open) dialog.close();
  }, [topic]);

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Brand />
          <p>A free, open-source Markdown editor for the browser.</p>
          <span className="license-note"><Check size={15} aria-hidden="true" /> MIT licensed</span>
        </div>
        <div className="footer-column">
          <h3>Product</h3>
          <a href={EDITOR_URL}>Open editor</a>
          <a href="#features">Features</a>
          <a href="#roadmap">Roadmap</a>
        </div>
        <div className="footer-column">
          <h3>Guides</h3>
          <a href="/markdown-guide">Complete Markdown guide</a>
          <a href="/blog">Markdown blog & templates</a>
          <a href="/seo/cheatsheet">Markdown cheatsheet</a>
          <a href="/seo/markdown-live-preview-editor">Live preview guide</a>
          <a href="/seo/examples/mermaid">Mermaid examples</a>
          <a href="/seo/examples/math">Math examples</a>
          <a href="/seo/markdown-to-html">Markdown to HTML</a>
          <a href="/seo/tutorials/markdown-to-pdf">Markdown to PDF</a>
        </div>
        <div className="footer-column">
          <h3>Project & access</h3>
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GitHub repository</a>
          <a href="#workspace">Interactive example</a>
          <a href="#privacy-details">Privacy details</a>
          <a href="/privacy-policy">Privacy policy</a>
          <a href="/terms">Terms of use</a>
          <a href="/cookie-policy">Cookie policy</a>
          <a href="/accessibility">Accessibility statement</a>
          <a href="/license">MIT license</a>
          <button type="button" onClick={() => setTopic("terms")}>Website terms</button>
          <button type="button" onClick={() => setTopic("accessibility")}>Accessibility</button>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Built in the open. Useful by design.</span>
        <GithubStarLink stars={stars} compact />
      </div>
      <dialog
        ref={dialogRef}
        className="info-dialog"
        aria-labelledby="info-dialog-title"
        onClose={() => setTopic(null)}
        onCancel={() => setTopic(null)}
      >
        {topic && (
          <div>
            <button className="dialog-close" type="button" aria-label="Close dialog" onClick={() => setTopic(null)}>
              <X size={20} aria-hidden="true" />
            </button>
            <p className="eyebrow">MARKUPS</p>
            <h2 id="info-dialog-title">{infoCopy[topic].title}</h2>
            <p>{infoCopy[topic].body}</p>
            {topic === "accessibility" && (
              <a href={`${REPOSITORY_URL}/issues`} target="_blank" rel="noreferrer" className="text-link">
                Open the GitHub issue tracker <GithubIcon size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </dialog>
    </footer>
  );
}
