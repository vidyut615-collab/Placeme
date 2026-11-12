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
    toast.success('Extracted parser text copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-[#12110F] text-[#EFECE6] rounded-[14px] shadow-xl border border-[#EFECE6]/[0.1] p-6 flex flex-col font-mono text-[12px] select-text">
      <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]/[0.08] mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#14B8A6] stroke-[1.5]" />
          <span className="font-medium text-[12px] text-[#EFECE6]">
            ATS extracted text stream
          </span>
          <span className="text-[11px] bg-[#191816] border border-[#EFECE6]/[0.08] text-[#ACA59A] px-2 py-0.5 rounded-md">
            Plain text
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#191816] hover:bg-[#24221F] border border-[#EFECE6]/[0.1] text-[#EFECE6] rounded-lg text-[12px] font-sans font-medium transition-colors duration-150 cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#14B8A6] stroke-[1.5]" />
          ) : (
            <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
          )}
          <span>{copied ? 'Copied' : 'Copy text'}</span>
        </button>
      </div>

      <div className="p-3 bg-[#191816] border border-[#EFECE6]/[0.08] rounded-lg mb-4 text-[12px] font-sans text-[#ACA59A] leading-relaxed">
        Preview of the linear plain-text stream automated ATS parsers extract from your resume. Verify contact fields, chronological dates, and headings appear cleanly in sequence.
      </div>

      <pre className="flex-1 whitespace-pre-wrap leading-relaxed text-[#EFECE6]/90 overflow-x-auto selection:bg-[#0F766E] selection:text-white">
        {rawText}
      </pre>
    </div>
  )
}
