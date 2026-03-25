"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <div className="animate-pulse h-4 bg-zinc-200 rounded w-3/4" />
});

type Props = {
  content: string;
  className?: string;
};

/** Styles pour blocs Markdown (paragraphes, listes, titres h2–h6, liens). */
const markdownClasses =
  "markdown-content [&_p]:text-sm [&_p]:text-zinc-700 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1,_h2,_h3]:font-semibold [&_h1,_h2,_h3]:text-zinc-900 [&_h1,_h2,_h3]:mt-4 [&_a]:text-zinc-700 [&_a]:underline";

const H1_LINE = /^#\s+(.+)$/;

export type MarkdownH1Section = { title: string; body: string };

/**
 * Découpe le Markdown en intro (avant le premier # titre) et sections H1.
 * Une ligne est un H1 seulement si elle correspond à `# Titre` (pas ##).
 */
export function splitMarkdownByH1(raw: string): {
  intro: string;
  sections: MarkdownH1Section[];
} {
  const lines = raw.split(/\r?\n/);
  const sections: MarkdownH1Section[] = [];
  const introLines: string[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(H1_LINE);
    if (m) {
      if (current) {
        sections.push({
          title: current.title.trim(),
          body: current.bodyLines.join("\n").trimEnd()
        });
      }
      current = { title: m[1].trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    sections.push({
      title: current.title.trim(),
      body: current.bodyLines.join("\n").trimEnd()
    });
  }

  return {
    intro: introLines.join("\n").trimEnd(),
    sections
  };
}

/** Hors `markdown-content` pour éviter tout conflit de sélecteurs sur le summary. */
const summaryClasses =
  "flex w-full cursor-pointer select-none list-none items-center justify-between gap-3 text-lg font-semibold text-zinc-900 py-2 [&::-webkit-details-marker]:hidden " +
  "rounded-lg px-1 -mx-1 transition hover:bg-zinc-50 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";

const detailsClasses =
  "markdown-details border-b border-zinc-100 last:border-b-0";

function MarkdownAccordionSection({ section }: { section: MarkdownH1Section }) {
  const [open, setOpen] = useState(true);

  return (
    <details
      className={detailsClasses}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className={summaryClasses}>
        <span className="min-w-0 flex-1 pr-2 text-left">{section.title}</span>
        <AccordionChevron />
      </summary>
      <div
        className={`border-l-2 border-zinc-100 pl-3 pb-2 pt-0.5 ${markdownClasses}`}
      >
        {section.body.trim() ? (
          <ReactMarkdown>{section.body}</ReactMarkdown>
        ) : null}
      </div>
    </details>
  );
}

function AccordionChevron() {
  return (
    <span
      className="markdown-details-chevron inline-flex shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="#3f3f46"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function MarkdownContent({ content, className = "" }: Props) {
  if (!content.trim()) return null;

  const { intro, sections } = splitMarkdownByH1(content);

  if (sections.length === 0) {
    return (
      <div className={`${markdownClasses} ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {intro.trim() ? (
          <div className={`markdown-intro ${markdownClasses}`}>
            <ReactMarkdown>{intro}</ReactMarkdown>
          </div>
        ) : null}

        {sections.map((section, i) => (
          <MarkdownAccordionSection
            key={`${section.title}-${i}`}
            section={section}
          />
        ))}
      </div>
    </div>
  );
}
