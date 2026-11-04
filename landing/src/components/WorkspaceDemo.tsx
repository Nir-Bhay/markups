import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Check, FileText, RotateCcw } from "lucide-react";
import { demoSamples, type DemoMode } from "../lib/samples";
const MarkdownDocument = lazy(() => import('./MarkdownDocument').then(module => ({ default: module.MarkdownDocument })));

const modes: { id: DemoMode; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "split", label: "Split" },
  { id: "preview", label: "Preview" },
];

export function WorkspaceDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(demoSamples.map((sample) => [sample.id, sample.markdown])),
  );
  const [mode, setMode] = useState<DemoMode>("split");
  const [narrow, setNarrow] = useState(false);
  const [mobilePane, setMobilePane] = useState<"source" | "preview">("source");
  const [splitRatio, setSplitRatio] = useState(50);
  const [dragging, setDragging] = useState(false);
  const panesRef = useRef<HTMLDivElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  useEffect(() => {
    const node = panesRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setPreviewReady(true); observer.disconnect(); }
    }, { rootMargin: '120px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const draggingRef = useRef(false);
  const modeRefs = useRef<Record<DemoMode, HTMLButtonElement | null>>({ write: null, split: null, preview: null });

  const sample = demoSamples[activeIndex];
  const markdown = drafts[sample.id];
  const edited = markdown !== sample.markdown;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const textarea = sourceRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, narrow ? 410 : 500)}px`;
  }, [markdown, narrow, splitRatio, mode]);

  const showSource = mode === "write" || (mode === "split" && (!narrow || mobilePane === "source"));
  const showPreview = mode === "preview" || (mode === "split" && (!narrow || mobilePane === "preview"));

  const updateRatioFromPointer = (clientX: number) => {
    const bounds = panesRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setSplitRatio(Math.min(70, Math.max(30, next)));
  };

  const onDividerPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateRatioFromPointer(event.clientX);
  };

  const onDividerPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) updateRatioFromPointer(event.clientX);
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onDividerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = splitRatio;
    if (event.key === "ArrowLeft") next -= 2;
    else if (event.key === "ArrowRight") next += 2;
    else if (event.key === "Home") next = 30;
    else if (event.key === "End") next = 70;
    else return;
    event.preventDefault();
    setSplitRatio(Math.min(70, Math.max(30, next)));
  };

  const onModeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: DemoMode) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const index = modes.findIndex((item) => item.id === current);
    const next = modes[(index + direction + modes.length) % modes.length];
    setMode(next.id);
    modeRefs.current[next.id]?.focus();
  };

  const paneStyle = {
    "--source-width": `${splitRatio}fr`,
    "--preview-width": `${100 - splitRatio}fr`,
  } as CSSProperties;

  return (
    <div className="workspace-surround">
      <div className="workspace-window">
        <div className="workspace-topbar">
          <div className="workspace-document-identity">
            <span className="workspace-file-icon" aria-hidden="true"><FileText size={17} /></span>
            <div>
              <strong>{sample.tab}</strong>
              <span>Editable worked example</span>
            </div>
          </div>
          <div className="demo-mode-control" role="group" aria-label="Editor view mode">
            {modes.map((item) => (
              <button
                key={item.id}
                ref={(node) => { modeRefs.current[item.id] = node; }}
                type="button"
                className={mode === item.id ? "is-active" : ""}
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
                onKeyDown={(event) => onModeKeyDown(event, item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="workspace-local-status"><Check size={14} aria-hidden="true" /> Local example</span>
        </div>

        <div className="workspace-examplebar">
          <div className="example-description">
            <span className="example-count">EXAMPLE {String(activeIndex + 1).padStart(2, "0")} / {String(demoSamples.length).padStart(2, "0")}</span>
            <p>{sample.description}</p>
          </div>
          <div className="example-actions" role="group" aria-label="Choose a Markdown example">
            {demoSamples.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`example-tab ${index === activeIndex ? "is-active" : ""}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className="compact-button reset-example-button"
              disabled={!edited}
              aria-label={`Reset ${sample.label} example`}
              onClick={() => setDrafts((current) => ({ ...current, [sample.id]: sample.markdown }))}
            >
              <RotateCcw size={15} aria-hidden="true" /><span>Reset</span>
            </button>
          </div>
        </div>

        <div className="workspace-controlbar">
          {narrow && mode === "split" && (
            <div className="mobile-pane-control" role="group" aria-label="Visible split pane">
              <button type="button" aria-pressed={mobilePane === "source"} className={mobilePane === "source" ? "is-active" : ""} onClick={() => setMobilePane("source")}>Source</button>
              <button type="button" aria-pressed={mobilePane === "preview"} className={mobilePane === "preview" ? "is-active" : ""} onClick={() => setMobilePane("preview")}>Rendered</button>
            </div>
          )}
          <span className="workspace-pane-tip">Edit the source; the complete rendered page updates alongside it.</span>
          <span className="example-edit-state">{edited ? "Edited" : "Ready"}<i aria-hidden="true" />{wordCount} words</span>
        </div>

        <div
          ref={panesRef}
          className={`workspace-panes mode-${mode} ${dragging ? "is-dragging" : ""}`}
          style={paneStyle}
        >
          <section className="workspace-source" aria-label="Markdown source" hidden={!showSource}>
            <div className="workspace-pane-heading"><span>MARKDOWN</span><span>Editable</span></div>
            <textarea
              ref={sourceRef}
              value={markdown}
              onChange={(event) => setDrafts((current) => ({ ...current, [sample.id]: event.target.value }))}
              aria-label="Editable Markdown example"
              spellCheck={false}
            />
          </section>
          {mode === "split" && !narrow && (
            <div
              className="workspace-divider"
              role="separator"
              aria-label="Resize source and preview panes"
              aria-orientation="vertical"
              aria-valuemin={30}
              aria-valuemax={70}
              aria-valuenow={Math.round(splitRatio)}
              aria-valuetext={`Source ${Math.round(splitRatio)} percent, preview ${Math.round(100 - splitRatio)} percent`}
              tabIndex={0}
              onPointerDown={onDividerPointerDown}
              onPointerMove={onDividerPointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onKeyDown={onDividerKeyDown}
              onDoubleClick={() => setSplitRatio(50)}
            >
              <span aria-hidden="true" />
            </div>
          )}
          <section className="workspace-preview" aria-label="Rendered Markdown preview" hidden={!showPreview}>
            <div className="workspace-pane-heading"><span>PREVIEW</span><span>Rendered live</span></div>
            <div className="workspace-preview-scroll">
              {previewReady ? <Suspense fallback={<p role="status">Preparing document preview…</p>}><MarkdownDocument markdown={markdown} /></Suspense> : <p>Live document preview — edit the Markdown to explore.</p>}
            </div>
          </section>
        </div>
        <div className="workspace-statusbar">
          <span><Check size={14} aria-hidden="true" /> The sample is editable. Your typing stays on this page.</span>
          <span>Markdown · tables · math · diagrams</span>
        </div>
      </div>
      <p className="workspace-caption">The sample is illustrative; open Markups to work with your own document. Edits here stay on this page and are not saved as Markups drafts.</p>
    </div>
  );
}
