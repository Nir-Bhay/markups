import { useEffect, useId, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import DOMPurify from "dompurify";
import "katex/dist/katex.css";
import "highlight.js/styles/github.css";

function MermaidDiagram({ definition }: { definition: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setSvg("");
    setError("");

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            primaryColor: "#EEF0FF",
            primaryBorderColor: "#8B93F8",
            primaryTextColor: "#141A2B",
            lineColor: "#667085",
            secondaryColor: "#F0FDFA",
            tertiaryColor: "#F7F9FD",
            clusterBkg: "#F7F9FD",
            edgeLabelBackground: "#FFFFFF",
          },
        });
        const id = `markups-diagram-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
        const result = await mermaid.render(id, definition);
        const safeSvg = DOMPurify.sanitize(result.svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        if (active) setSvg(safeSvg);
      } catch (reason) {
        if (!active) return;
        setSvg("");
        setError(reason instanceof Error ? reason.message : "This diagram could not be rendered.");
      }
    }

    void renderDiagram();
    return () => {
      active = false;
    };
  }, [definition, reactId]);

  if (error) {
    return (
      <div className="diagram-state diagram-state-error" role="alert">
        <strong>Diagram not rendered</strong>
        <span>Check the Mermaid syntax in the source pane.</span>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="diagram-state" role="status">
        Rendering diagram…
      </div>
    );
  }

  return (
    <figure
      className="mermaid-figure"
      aria-label="Rendered Mermaid diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

type CodeProps = {
  className?: string;
  children?: ReactNode;
};

function MarkdownCode({ className, children, ...props }: CodeProps) {
  const value = String(children ?? "");
  const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
  const isBlock = Boolean(language) || value.includes("\n");

  if (language === "mermaid") {
    return <MermaidDiagram definition={value.replace(/\n$/, "")} />;
  }

  if (!isBlock) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="code-block-wrap">
      {language && <span className="code-language">{language}</span>}
      <pre>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownDocument({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-document">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          code: MarkdownCode,
          pre: ({ children }) => <>{children}</>,
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
