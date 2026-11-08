'use client'

import React, { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'
import { toast } from 'sonner'

interface ATSParserViewProps {
  rawText: string
}

export default function ATSParserView({ rawText }: ATSParserViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText)
    setCopied(true)
    toast.success('Extracted text copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-zinc-950 text-zinc-100 rounded-lg shadow-2xl border border-zinc-800 p-6 flex flex-col font-mono text-xs select-text">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-zinc-300">
            Automated ATS Parser Stream
          </span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
            Plain Text Mode
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Text'}
        </button>
      </div>

      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded mb-4 text-[11px] text-zinc-400">
        💡 This is the raw sequence of words that hiring algorithms and ATS robots read from your resume. If sections or contact details appear in the wrong order here, adjust your section sequence.
      </div>

      {/* Raw Stream Output */}
      <pre className="flex-1 whitespace-pre-wrap leading-relaxed text-zinc-300 overflow-x-auto selection:bg-blue-600 selection:text-white">
        {rawText}
      </pre>
    </div>
  )
}
