import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

/**
 * Custom MDX components for blog posts
 * These components style MDX content with Colorado Mesh's design system
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with proper styling and IDs for anchor links
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-8 mb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-3" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-lg md:text-xl font-semibold text-foreground mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children, ...props }) => (
      <p className="text-foreground-muted leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),

    // Links - internal and external handling
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith('http');
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mesh hover:text-mesh/80 underline underline-offset-2 transition-colors"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href || '#'} className="text-mesh hover:text-mesh/80 underline underline-offset-2 transition-colors" {...props}>
          {children}
        </Link>
      );
    },

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside text-foreground-muted mb-4 space-y-2 pl-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside text-foreground-muted mb-4 space-y-2 pl-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-foreground-muted" {...props}>
        {children}
      </li>
    ),

    // Code blocks and inline code
    pre: ({ children, ...props }) => (
      <pre
        className="bg-night-900 rounded-lg p-4 overflow-x-auto mb-4 text-sm border border-card-border"
        {...props}
      >
        {children}
      </pre>
    ),
    code: ({ children, ...props }) => {
      // Check if this is inline code (no className from syntax highlighting)
      const isInline = typeof props.className === 'undefined';
      if (isInline) {
        return (
          <code
            className="bg-night-800 text-mesh px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return <code {...props}>{children}</code>;
    },

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-mesh pl-4 py-2 my-4 bg-night-900/50 rounded-r-lg italic text-foreground-muted"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rules
    hr: (props) => <hr className="my-8 border-card-border" {...props} />,

    // Images
    img: ({ src, alt, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        className="rounded-lg my-4 max-w-full h-auto"
        loading="lazy"
        {...props}
      />
    ),

    // Tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-night-800/50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-2 text-left text-foreground font-semibold border-b border-card-border" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2 text-foreground-muted border-b border-card-border" {...props}>
        {children}
      </td>
    ),

    // Strong and emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    ...components,
  };
}
