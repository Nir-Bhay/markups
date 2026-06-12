# Security Policy — Markups

> **Last Updated:** 2026-06-12
> **Applies to:** Markups project (https://markups.dev) — Vite + Vercel deployment

Thank you for helping keep Markups and its users safe. Markups is a
**client-side, browser-only** Markdown editor with no backend, no
authentication, and no user data stored on a server. This document
describes the security posture, headers, and how to report issues.

---

## 1. Security Headers (Vercel / vercel.json)

The following security headers are applied to **every response**
served from `markups.dev` via `vercel.json → headers`:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing. |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection (allows same-origin iframes only). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full path on same-origin, origin only on cross-origin HTTPS, nothing on downgrade. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Disables powerful APIs by default. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HSTS — forces HTTPS for one year, eligible for browser preload lists. |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Isolates browsing context but allows same-origin popups (Vercel Insights, OAuth flows). |
| `Cross-Origin-Resource-Policy` | `same-origin` | Limits cross-origin embedding of static resources. |
| `Content-Security-Policy` | See below | Defense-in-depth against XSS and data exfiltration. |

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval'
            https://fonts.googleapis.com
            https://cdn.jsdelivr.net
            https://www.googletagmanager.com
            https://www.clarity.ms https://*.clarity.ms
            https://vitals.vercel-insights.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https: wss:;
worker-src 'self' blob:;
child-src 'self' blob:;
frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
manifest-src 'self';
```

### CSP Trade-offs (Why we keep `'unsafe-inline'` / `'unsafe-eval'`)

| Directive | Reason |
|---|---|
| `script-src 'unsafe-inline'` | Monaco Editor injects inline scripts at runtime and uses blob: workers. Required for live editing. |
| `script-src 'unsafe-eval'` | Monaco, Mermaid, and KaTeX use `eval` / `new Function` to render dynamic content. |
| `script-src https://cdn.jsdelivr.net` | KaTeX, Mermaid, and other vendor libraries may be loaded from jsDelivr in some flows. |
| `connect-src https: wss:` | Mermaid + Monaco call back to themselves and to remote fetches. |
| `frame-ancestors 'self'` | Clickjacking protection; allows same-origin iframes only. |

> **Hardening roadmap:** A nonce-based CSP can replace
> `'unsafe-inline'` once Monaco is loaded via a service worker
> that injects the nonce. This is a planned, future hardening.

### Cache-Control

Static, fingerprinted assets are served with
`Cache-Control: public, max-age=31536000, immutable`.
The service worker (`/sw.js`) is served with
`Cache-Control: public, max-age=0, must-revalidate` so updates
roll out immediately. The manifest is cached for 1 day.

---

## 2. Client-Side Hardening

| Surface | Hardening |
|---|---|
| **Markdown rendering** | All user-supplied Markdown is parsed by `marked` and then sanitized with `DOMPurify` before injection into the preview pane. No `innerHTML` writes from raw user content. |
| **Mermaid** | Rendered inside a sandboxed DOMPurify-cleansed container with no inline event handlers. |
| **KaTeX** | Trusted-types-friendly output; no `eval` of user content. |
| **Image upload** | Images are read as data URLs and stored in IndexedDB; no upload to any third-party server. |
| **External scripts** | Only Google Fonts CSS, Google Analytics (gtag), Microsoft Clarity, and Vercel Web Analytics are loaded. All have explicit allowances in CSP. |
| **External links** | All `target="_blank"` anchors include `rel="noopener noreferrer"` to prevent reverse-tabnabbing and Referrer leakage. Verified in both `index.html` and `landing/index.html`. |
| **PWA / Service Worker** | `/sw.js` uses a cache-first strategy for static assets and a network-first strategy for HTML. |
| **LocalStorage / IndexedDB** | No PII stored. All content stays client-side. |
| **Cookies** | None set. (Analytics are cookieless / IP-anonymized.) |
| **3rd-party iframes** | None embedded. YouTube embeds would be `youtube-nocookie.com` only. |

---

## 3. Build & Dependency Hygiene

| Item | Status |
|---|---|
| `npm audit` | Run on every release. Tracked in CI. |
| Vite build target | `es2020` (smaller bundles, modern browsers only). |
| Console / debugger stripping | `esbuild.drop = ['console', 'debugger']` in production. |
| Source maps | Disabled in production. Hidden `nosources` if needed for error reporting. |
| Manual chunks | `monaco-editor`, `mermaid-vendor`, `katex-vendor`, `markdown-vendor`, `dom-utils`, `storage-vendor` for cacheable long-term chunks. |

---

## 4. Reporting a Vulnerability

**Please do not open a public GitHub issue for security bugs.**

Report privately via one of:

- **GitHub Security Advisories:** [https://github.com/Nir-Bhay/markups/security/advisories/new](https://github.com/Nir-Bhay/markups/security/advisories/new)
- **Email:** `security@markups.dev` *(if configured)* — fall back to
  opening a Security Advisory on GitHub.

Please include:

1. A clear description of the issue and impact.
2. Steps to reproduce (URL, payload, browser).
3. Affected version / commit SHA.
4. Your name / handle for the credit line (optional).

We aim to:

- **Acknowledge** within 72 hours.
- **Triage** within 7 days.
- **Patch critical** issues within 30 days, sooner when feasible.

---

## 5. Supported Versions

| Version | Supported |
|---|---|
| Latest `main` branch | Yes |
| Older releases | Best effort. Open an issue to request a backport. |

Markups is a static, single-page app. Users are always on the
**latest deployed version** — there is no concept of an "outdated
client". When a critical fix lands on `main`, it ships to
production on the next Vercel deploy.

---

## 6. Out-of-Scope (By Design)

The following are **intentionally not** in scope for this
project and **are not** vulnerabilities:

| Behavior | Why |
|---|---|
| Storing Markdown in `localStorage` / `IndexedDB` | Core feature. Users explicitly choose to persist drafts. |
| Loading Google Fonts | Subject to a privacy trade-off. Users can switch to system fonts in the UI. |
| Loading Google Analytics / Microsoft Clarity | Anonymous, IP-anonymized, opt-out-able. The landing page exposes this in `privacy-policy`. |
| Allowing same-origin iframes (`frame-ancestors 'self'`) | PWA / embed support. |
| `unsafe-eval` in CSP | Required for Monaco + Mermaid. See trade-offs above. |

---

## 7. Verification

After every deploy, the security posture is verified by:

1. Vercel Analytics showing the new headers in the response inspector.
2. `https://securityheaders.com/?q=markups.dev` — target: A or A+.
3. `https://observatory.mozilla.org/analyze/markups.dev` — target: A or A+.

If a regression is observed, the deploy is rolled back via Vercel.

---

**Thank you for taking security seriously. Markups is open source
because we believe writing tools should be transparent, auditable,
and safe.**

---

## 8. Known Unfixed Dependency Issues (Tracked)

| Package | Severity | Reason Not Upgraded | Mitigation |
|---|---|---|---|
| `html2pdf.js@0.12.x` (and its `jspdf@<4.2.0` dependency) | Critical | `0.14.0` is a breaking change for the export API used in `src/services/export/pdf.js`. Upgrade requires refactor of `.set().from().outputPdf()` / `.save()` calls. | Input to PDF is **always sanitized by DOMPurify** before being passed to `html2pdf.js`, neutralizing the upstream XSS path. Export runs **client-side only**; no PII crosses any server. Track in issue **#TBD**. |

These do **not** affect the public surface of the app, only the
optional "Export to PDF" feature. The Markdown → HTML → PDF
pipeline is entirely client-side; no data leaves the user's
browser.
