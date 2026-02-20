/** biome-ignore-all lint/performance/useTopLevelRegex: Used for parsing markdown */
import { memo, useId, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock, CodeBlockCode } from "./code-block";

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

/**
 * Lightweight block splitter — replaces `marked.lexer()` to eliminate the ~40KB `marked` bundle.
 * Splits on double newlines (paragraph boundaries) while preserving fenced code blocks as single units.
 */
const FENCED_CODE_RE = /^```[\s\S]*?^```/gm;

function parseMarkdownIntoBlocks(markdown: string): string[] {
  // Preserve fenced code blocks by replacing them with placeholders
  const codeBlocks: string[] = [];
  const withPlaceholders = markdown.replace(FENCED_CODE_RE, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Split on double newlines
  const rawBlocks = withPlaceholders.split(/\n{2,}/);

  // Restore code blocks and filter empties
  return rawBlocks
    .map((block) =>
      block.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)]!)
    )
    .filter((block) => block.trim().length > 0);
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext";
  const match = className.match(/language-(\w+)/);
  return match ? match[1]! : "plaintext";
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <span
          className={cn("rounded-sm bg-primary-foreground px-1 font-mono text-sm", className)}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string;
    components?: Partial<Components>;
  }) {
    return (
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div className={className}>
      {blocks.map((block) => (
        <MemoizedMarkdownBlock
          components={components}
          content={block}
          key={`${blockId}-${block}`}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
