import { useEffect, useRef, useState } from "react";
import { Bold, Check, Code2, Italic, Link2, Pause, Play, Plus } from "lucide-react";

export function HeroEditor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.12,
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPhase(3);
      return;
    }
    if (!playing || !visible) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const runCycle = () => {
      if (cancelled) return;
      setPhase(1);
      timers.push(setTimeout(() => setPhase(2), 1500));
      timers.push(setTimeout(() => setPhase(3), 2350));
      timers.push(setTimeout(() => setPhase(4), 9600));
      timers.push(setTimeout(() => setPhase(0), 10300));
      timers.push(setTimeout(runCycle, 11000));
    };
    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [playing, visible, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      root.style.setProperty("--hero-scale", String(1 - progress * 0.04));
      root.style.setProperty("--hero-wash-progress", String(progress));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const saving = phase === 1 || phase === 2;
  const insertedVisible = phase >= 1 && phase <= 3;
  const previewVisible = phase >= 2 && phase <= 3;

  return (
    <div className="hero-visual" ref={rootRef}>
      <div className="hero-wash" aria-hidden="true" />
      <div className="hero-frame-scroll">
        <figure className="hero-editor-frame" aria-labelledby="hero-editor-caption">
          <figcaption id="hero-editor-caption" className="sr-only">
            A Markups split editor with Markdown source on the left and a rendered project brief on the right.
          </figcaption>
          <div className="hero-tabbar" aria-hidden="true">
            <div className="hero-app-dots"><i /><i /><i /></div>
            <div className="hero-document-tabs">
              <span className="hero-document-tab is-active"><i />Project brief</span>
              <span className="hero-document-tab">Untitled</span>
              <span className="hero-add-tab"><Plus size={14} /></span>
            </div>
            <span className="hero-tab-meta">2 tabs</span>
          </div>
          <div className="hero-toolbar">
            <div className="hero-format-tools" aria-hidden="true">
              <span><Bold size={15} /></span>
              <span><Italic size={15} /></span>
              <span><Link2 size={15} /></span>
              <span><Code2 size={15} /></span>
            </div>
            <div className="hero-mode-control" aria-label="Split mode shown">
              <span>Write</span><span className="is-active">Split</span><span>Preview</span>
            </div>
            <button
              className="hero-playback"
              type="button"
              onClick={() => setPlaying((value) => !value)}
              aria-label={reducedMotion ? "Static editor demonstration; reduced motion is enabled" : playing ? "Pause editor demonstration" : "Play editor demonstration"}
              disabled={reducedMotion}
            >
              {playing && !reducedMotion ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              <span>{reducedMotion ? "Static" : playing ? "Pause" : "Play"}</span>
            </button>
          </div>
          <div className="hero-panes">
            <div className="hero-source-pane">
              <div className="hero-pane-label"><span>MARKDOWN</span><span>21 lines</span></div>
              <div className="hero-source-code">
                <div><span className="line-number">1</span><span className="md-heading"># Project brief</span></div>
                <div><span className="line-number">2</span><span /></div>
                <div><span className="line-number">3</span><span>Shape the draft beside a</span></div>
                <div><span className="line-number">4</span><span>clear, rendered document.</span></div>
                <div><span className="line-number">5</span><span /></div>
                <div><span className="line-number">6</span><span className="md-heading">## Scope</span></div>
                <div><span className="line-number">7</span><span /></div>
                <div><span className="line-number">8</span><span className="md-table">| Piece   | State |</span></div>
                <div><span className="line-number">9</span><span className="md-table">| ------- | ----- |</span></div>
                <div><span className="line-number">10</span><span className="md-table">| Source  | Ready |</span></div>
                <div><span className="line-number">11</span><span className="md-table">| Preview | Live  |</span></div>
                <div><span className="line-number">12</span><span /></div>
                <div><span className="line-number">13</span><span className="md-fence">```mermaid</span></div>
                <div><span className="line-number">14</span><span className="md-code">flowchart LR</span></div>
                <div><span className="line-number">15</span><span className="md-code"> A[Draft] --&gt; B[Review]</span></div>
                <div><span className="line-number">16</span><span className="md-code"> B --&gt; C[Export]</span></div>
                <div><span className="line-number">17</span><span className="md-fence">```</span></div>
                <div><span className="line-number">18</span><span /></div>
                <div><span className="line-number">19</span><span className="md-math">$$C = 2\pi r$$</span></div>
                <div><span className="line-number">20</span><span /></div>
                <div className={`hero-inserted-line ${insertedVisible ? "is-inserted" : ""} ${phase === 4 ? "is-resetting" : ""}`}>
                  <span className="line-number">21</span><span>&gt; Source and preview, together.</span>
                </div>
              </div>
            </div>
            <div className="hero-preview-pane">
              <div className="hero-pane-label"><span>PREVIEW</span><span>Project brief</span></div>
              <article className="hero-rendered-document">
                <p className="hero-doc-kicker">PROJECT / OVERVIEW</p>
                <h2>Project brief</h2>
                <p>Shape the draft beside a clear, rendered document.</p>
                <h3>Scope</h3>
                <table>
                  <thead><tr><th>Piece</th><th>State</th></tr></thead>
                  <tbody><tr><td>Source</td><td>Ready</td></tr><tr><td>Preview</td><td><span className="live-label">Live</span></td></tr></tbody>
                </table>
                <div className="hero-diagram" aria-label="Draft flows to Review, then Export">
                  <span>Draft</span><i aria-hidden="true" /><span>Review</span><i aria-hidden="true" /><span>Export</span>
                </div>
                <div className="hero-equation" aria-label="C equals two pi r">C = 2πr</div>
                <blockquote className={`${previewVisible ? "is-visible" : ""} ${phase === 4 ? "is-resetting" : ""}`}>
                  Source and preview, together.
                </blockquote>
              </article>
            </div>
          </div>
          <div className="hero-statusbar">
            <span className={`hero-save-status ${saving ? "is-saving" : ""}`}>
              {saving ? <span className="save-dot" aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
              {saving ? "Saving…" : "Saved locally"}
            </span>
            <span>Markdown&nbsp;&nbsp;·&nbsp;&nbsp;UTF-8</span>
          </div>
        </figure>
      </div>
      <div className="hero-floating-note"><span aria-hidden="true"><Check size={14} /></span>No setup. Start writing.</div>
    </div>
  );
}
