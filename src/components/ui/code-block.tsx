import * as React from "react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
    code: string;
    language?: string;
    className?: string;
};

export function CodeBlock({ code, language, className }: CodeBlockProps) {
    return (
        <div className={cn("rounded-xl border bg-slate-950 text-slate-100", className)}>
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {language || "text"}
                </span>
            </div>
            <pre className="max-h-80 overflow-auto p-3 text-xs leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    );
}

