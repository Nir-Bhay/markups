// Small progressive enhancement for the illustrative landing-page samples.
// Does not initialize the production editor or request remote data.
const examples = {
  readme: '# Project Atlas\n\nWrite the next big thing.\n\n## What\'s inside\n- [x] Live preview\n- [x] Mermaid diagrams\n- [ ] Ship something great\n\n**Write. Preview. Share.**',
  mermaid: '# How we ship\n\nFlowchart for our release.\n\n&#96;&#96;&#96;mermaid\nflowchart LR\n  A[Write] --> B[Review]\n  B --> C[Ship]\n&#96;&#96;&#96;'.replaceAll('&#96;', String.fromCharCode(96)),
  math: '# Beautiful equations\n\nMath belongs in your notes.\n\n$$\nE = mc^2\n$$\n\nRendered with KaTeX.'
};

const tabs = [...document.querySelectorAll('[data-sample]')];
const panels = [...document.querySelectorAll('[data-panel]')];
function activate(name, focus = false) {
  for (const tab of tabs) {
    const on = tab.dataset.sample === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  for (const panel of panels) panel.hidden = panel.dataset.panel !== name;
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab.dataset.sample));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    activate(tabs[next].dataset.sample, true);
  });
});
const feedback = document.getElementById('copy-feedback');
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const source = examples[button.dataset.copy];
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      if (feedback) feedback.textContent = 'Markdown sample copied to clipboard.';
    } catch {
      if (feedback) feedback.textContent = 'Clipboard access unavailable. Open the editor to copy your content.';
    }
  });
});
