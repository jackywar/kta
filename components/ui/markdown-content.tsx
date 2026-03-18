"use client";

import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <div className="animate-pulse h-4 bg-zinc-200 rounded w-3/4" />
});

type Props = {
  content: string;
  className?: string;
};

const markdownClasses =
  "markdown-content [&_p]:text-sm [&_p]:text-zinc-700 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1,_h2,_h3]:font-semibold [&_h1,_h2,_h3]:text-zinc-900 [&_h1,_h2,_h3]:mt-4 [&_a]:text-zinc-700 [&_a]:underline";

export function MarkdownContent({ content, className = "" }: Props) {
  if (!content.trim()) return null;

  return (
    <div className={`${markdownClasses} ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
