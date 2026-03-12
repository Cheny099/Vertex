import type { Components } from 'react-markdown';

export const legalMarkdownRenderers: Components = {
    p: ({ node, ...props }) => (
        <p
            className="mb-4 last:mb-0 whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed"
            {...props}
        />
    ),
    li: ({ node, ...props }) => (
        <li className="whitespace-pre-wrap text-slate-700 dark:text-slate-300" {...props} />
    ),
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
    h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-6 pb-2 border-b tracking-tight" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 tracking-tight" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 tracking-tight" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white" {...props} />,
};
