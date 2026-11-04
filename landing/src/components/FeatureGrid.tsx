import {
  Check,
  Code2,
  Download,
  FileDown,
  FileText,
  Focus,
  Folder,
  History,
  Image as ImageIcon,
  Keyboard,
  KeyRound,
  Link2,
  ListTree,
  PenLine,
  Play,
  Printer,
  Search,
  Table2,
  Target,
} from "lucide-react";

const secondaryFeatures = [
  { icon: Focus, title: "Focus & typewriter", text: "Reduce visual noise and keep the active line close." },
  { icon: Search, title: "Find & replace", text: "Move through a draft and make precise text changes." },
  { icon: History, title: "Local version history", text: "Return to earlier locally saved versions of a document." },
  { icon: Target, title: "Goals & document stats", text: "Keep word goals and useful counts beside the work." },
  { icon: Keyboard, title: "Vim keybindings", text: "Choose familiar modal editing when it suits your flow." },
  { icon: ListTree, title: "TOC & backlinks", text: "Navigate structure and connections between documents." },
];

export function FeatureGrid() {
  return (
    <>
      <div className="bento-grid">
        <article className="bento-card bento-write">
          <div className="bento-copy">
            <span className="feature-icon"><PenLine size={20} aria-hidden="true" /></span>
            <h3>Write and preview together.</h3>
            <p>Switch between writing, split, and preview modes as your focus changes. Keep the source and finished page in sync.</p>
          </div>
          <div className="mini-split-visual" aria-hidden="true">
            <div className="mini-window-bar"><span>Project-notes.md</span><div><i>Write</i><i className="active">Split</i><i>Preview</i></div></div>
            <div className="mini-split-body">
              <div className="mini-source">
                <b># Project notes</b>
                <span>Keep decisions beside</span>
                <span>the finished document.</span>
                <em>## Next steps</em>
                <span>- [x] Draft outline</span>
                <span>- [ ] Review details</span>
              </div>
              <div className="mini-rendered">
                <b>Project notes</b>
                <span>Keep decisions beside the finished document.</span>
                <strong>Next steps</strong>
                <span className="mini-check"><Check size={11} /> Draft outline</span>
                <span className="mini-check open"><i /> Review details</span>
              </div>
            </div>
          </div>
        </article>

        <article className="bento-card bento-rich bento-tinted">
          <div className="bento-copy">
            <span className="feature-icon"><Code2 size={20} aria-hidden="true" /></span>
            <h3>Rich Markdown, rendered clearly.</h3>
            <p>Code, equations, tables, and diagrams live together in one editable document and its rendered preview.</p>
          </div>
          <div className="rich-preview-visual" aria-hidden="true">
            <div className="rich-preview-topbar">
              <span><FileText size={14} />executive-brief.md</span>
              <span className="rich-live-label"><i />Rendered preview</span>
            </div>
            <div className="rich-preview-grid">
              <div className="rich-preview-module rich-code-module">
                <div className="rich-module-label"><span><Code2 size={13} /> CODE</span><em>TypeScript</em></div>
                <pre><code><b>const</b> nextStep = <i>"review"</i>;</code></pre>
              </div>
              <div className="rich-preview-module rich-math-module">
                <div className="rich-module-label"><span><i>∑</i> MATH</span><em>KaTeX</em></div>
                <strong>effort = <b>time × focus</b></strong>
              </div>
              <div className="rich-preview-module rich-diagram-module">
                <div className="rich-module-label"><span><Link2 size={13} /> FLOW</span><em>Mermaid</em></div>
                <div className="rich-flow"><i>Draft</i><b>→</b><i>Review</i><b>→</b><i>Share</i></div>
              </div>
              <div className="rich-preview-module rich-table-module">
                <div className="rich-module-label"><span><Table2 size={13} /> TABLE</span><em>Aligned data</em></div>
                <div className="rich-table-row rich-table-heading"><span>Owner</span><span>Next action</span><span>Status</span></div>
                <div className="rich-table-row"><strong>Product</strong><span>Review brief</span><b>Ready</b></div>
              </div>
            </div>
          </div>
        </article>

        <article className="bento-card bento-organize">
          <div className="bento-copy">
            <span className="feature-icon"><Folder size={20} aria-hidden="true" /></span>
            <h3>Keep drafts organized.</h3>
            <p>Keep related drafts together, find the current version, and move between documents without losing your place.</p>
          </div>
          <div className="organize-visual" aria-hidden="true">
            <div className="organize-topbar"><span><Folder size={15} /> Launch planning</span><span>4 drafts</span></div>
            <div className="folder-tree">
              <div className="tree-folder"><Folder size={15} /><strong>Team workspace</strong><span>Folder</span></div>
              <div className="tree-child is-current"><FileText size={14} /><span><strong>Executive team draft</strong><small>Edited a moment ago</small></span><i>OPEN</i></div>
              <div className="tree-child"><FileText size={14} /><span><strong>Customer interviews</strong><small>Research notes</small></span></div>
              <div className="tree-child"><FileText size={14} /><span><strong>Launch checklist</strong><small>12 items</small></span></div>
            </div>
          </div>
        </article>

        <article className="bento-card bento-export">
          <div className="bento-copy">
            <span className="feature-icon"><Download size={20} aria-hidden="true" /></span>
            <h3>A document that travels with you.</h3>
            <p>Keep the Markdown source, then choose a format for the next step in your workflow.</p>
          </div>
          <div className="export-showcase" aria-label="Available export formats">
            <div className="export-showcase-heading"><span>TAKE YOUR WORK WITH YOU</span><span>Choose when ready</span></div>
            <div className="export-primary-grid">
              <div><span className="export-format-icon"><FileText size={17} aria-hidden="true" /></span><span className="export-format-copy"><strong>Markdown</strong><small>Editable source</small></span><b>.md</b></div>
              <div><span className="export-format-icon"><Code2 size={17} aria-hidden="true" /></span><span className="export-format-copy"><strong>HTML</strong><small>Standalone page</small></span><b>.html</b></div>
              <div><span className="export-format-icon"><FileDown size={17} aria-hidden="true" /></span><span className="export-format-copy"><strong>PDF</strong><small>Image-based output</small></span><b>.pdf</b></div>
              <div><span className="export-format-icon"><FileText size={17} aria-hidden="true" /></span><span className="export-format-copy"><strong>Word-compatible</strong><small>HTML, not native DOCX</small></span><b>.doc</b></div>
            </div>
            <div className="export-additional-formats">
              <span>ALSO AVAILABLE</span>
              <span><FileText size={14} aria-hidden="true" />Plain text</span>
              <span><ImageIcon size={14} aria-hidden="true" />PNG</span>
              <span><Printer size={14} aria-hidden="true" />Print</span>
            </div>
          </div>
        </article>

        <article className="bento-card bento-media">
          <div className="bento-copy">
            <span className="feature-icon"><ImageIcon size={20} aria-hidden="true" /></span>
            <h3>Add useful media.</h3>
            <p>Insert and resize images, then bring supported video links into the preview.</p>
          </div>
          <div className="media-visual" aria-hidden="true">
            <div className="resizable-image">
              <svg viewBox="0 0 300 150" role="presentation">
                <rect width="300" height="150" rx="8" fill="#F7F9FD" />
                <rect x="22" y="22" width="66" height="34" rx="7" fill="#EEF0FF" stroke="#9BA4F7" />
                <rect x="116" y="22" width="66" height="34" rx="7" fill="#EEF0FF" stroke="#9BA4F7" />
                <rect x="210" y="22" width="66" height="34" rx="7" fill="#EEF0FF" stroke="#9BA4F7" />
                <path d="M88 39h28m88 0h28" stroke="#667085" strokeWidth="2" />
                <path d="M42 108h216M42 94v28m54-22v16m54-27v27m54-18v18m54-26v26" stroke="#C6CDDA" strokeWidth="2" />
                <path d="M42 108c40-6 58-31 95-23 34 8 48 27 97 4" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <i className="resize-handle handle-tl" /><i className="resize-handle handle-tr" /><i className="resize-handle handle-bl" /><i className="resize-handle handle-br" />
              <span className="image-size-label">640 × 320</span>
            </div>
            <div className="video-preview">
              <span className="video-play"><Play size={19} fill="currentColor" /></span>
              <div><strong>Video preview</strong><span>Supported video link</span></div>
            </div>
          </div>
        </article>

        <article className="bento-card bento-ai">
          <div className="bento-copy">
            <span className="feature-icon"><KeyRound size={20} aria-hidden="true" /></span>
            <h3>Your AI provider, your choice.</h3>
            <p>Bring a provider key, select the context you want to send, and apply writing help from a side, split, or floating panel.</p>
          </div>
          <div className="ai-panel-visual" aria-hidden="true">
            <div className="ai-panel-top"><KeyRound size={15} /><span>Writing assistant</span><i>Optional</i></div>
            <div className="ai-selection"><span>Selected context</span><strong>“The second paragraph…”</strong></div>
            <div className="ai-review-action">Review selection <span>→</span></div>
            <div className="ai-layouts"><span className="active">Right</span><span>Split</span><span>Floating</span></div>
          </div>
          <p className="ai-qualifier">AI requests go to the provider you configure.</p>
        </article>
      </div>
      <div className="secondary-feature-grid">
        {secondaryFeatures.map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <Icon size={19} aria-hidden="true" />
            <div><h3>{title}</h3><p>{text}</p></div>
          </article>
        ))}
      </div>
    </>
  );
}
