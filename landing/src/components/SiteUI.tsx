import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import type { StarState } from "../hooks/useGithubStars";
import { GithubIcon } from "./BrandIcons";

export const EDITOR_URL = "/";
export const REPOSITORY_URL = "https://github.com/Nir-Bhay/markups";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label={compact ? "Markups, back to top" : undefined}>
      <span className="brand-mark" aria-hidden="true">M</span>
      {!compact && <span className="brand-word">Markups</span>}
    </a>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
  icon,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  className?: string;
  external?: boolean;
  icon?: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`button button-${variant} ${className}`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span>{children}</span>
      {icon ?? (external ? <ArrowUpRight size={17} aria-hidden="true" /> : null)}
    </a>
  );
}

export function GithubStarLink({
  stars,
  compact = false,
  className = "",
  label,
}: {
  stars: StarState;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const count = stars.status === "loaded" && stars.count !== null
    ? new Intl.NumberFormat("en", { notation: stars.count > 9999 ? "compact" : "standard" }).format(stars.count)
    : null;

  return (
    <a
      className={`github-star-link ${compact ? "github-star-compact" : ""} ${className}`}
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer"
    >
      {compact ? <GithubIcon size={17} aria-hidden="true" /> : <Star size={17} aria-hidden="true" />}
      <span>{label ?? (compact ? "Star" : "Star on GitHub")}</span>
      <span className={`star-count ${stars.status === "loading" ? "is-loading" : ""}`}>
        {stars.status === "loading" ? (
          <>
            <span aria-hidden="true">···</span>
            <span className="sr-only">Loading current star count</span>
          </>
        ) : count}
      </span>
    </a>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className = "",
  id,
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div className={`section-heading section-heading-${align} ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
      {body && <div className="section-intro">{body}</div>}
    </div>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
