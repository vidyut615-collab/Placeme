'use client'

import React from 'react'
import { ResumeSettings } from './templates/types'
import { Layout, Type, Palette, MoveVertical, Maximize2, Check } from 'lucide-react'

interface CustomizationToolbarProps {
  settings: ResumeSettings
  onChange: (updated: Partial<ResumeSettings>) => void
}

const TEMPLATES: Array<{ id: ResumeSettings['template']; name: string; desc: string }> = [
  { id: 'classic', name: 'Classic ATS', desc: 'Single-column layout built for strict parser clarity' },
  { id: 'modern', name: 'Modern split', desc: 'Two-column layout with structured summary rail' },
  { id: 'executive', name: 'Executive', desc: 'Minimalist typographic hierarchy with restrained rules' },
]

const FONTS = [
  { id: 'Inter, sans-serif', name: 'Inter (Clean sans)' },
  { id: 'Roboto, sans-serif', name: 'Roboto (Neutral sans)' },
  { id: 'Merriweather, serif', name: 'Merriweather (Editorial serif)' },
  { id: 'Outfit, sans-serif', name: 'Outfit (Geometric sans)' },
  { id: 'Georgia, serif', name: 'Georgia (Classic serif)' },
]

const ACCENT_COLORS = [
  { hex: '#0F766E', label: 'Pine teal' },
  { hex: '#1e3a8a', label: 'Navy' },
  { hex: '#1e293b', label: 'Charcoal' },
  { hex: '#047857', label: 'Emerald' },
  { hex: '#991b1b', label: 'Burgundy' },
  { hex: '#0369a1', label: 'Slate sky' },
]

export default function CustomizationToolbar({
  settings,
  onChange,
}: CustomizationToolbarProps) {
  return (
    <div className="p-6 space-y-6 text-[13px]">
      {/* Template Chooser */}
      <div className="space-y-2.5">
        <label className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
          <Layout className="w-4 h-4 stroke-[1.5]" />
          <span>Resume template</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((tmpl) => {
            const isSelected = settings.template === tmpl.id
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onChange({ template: tmpl.id })}
                className={`p-3 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.06] dark:bg-[#14B8A6]/10 text-[#1C1917] dark:text-[#EFECE6]'
                    : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] hover:border-[#0F766E]/35 dark:hover:border-[#14B8A6]/35 text-[#1C1917] dark:text-[#EFECE6]'
                }`}
              >
                <div>
                  <div className="font-medium text-[13px]">{tmpl.name}</div>
                  <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                    {tmpl.desc}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.75] shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-2.5">
        <label className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
          <Type className="w-4 h-4 stroke-[1.5]" />
          <span>Typography & font</span>
        </label>

        <select
          value={settings.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full h-9 px-3 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[13px] text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-1 bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] p-1 rounded-lg">
          <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] px-2">
            Size
          </span>
          {[9, 9.5, 10, 10.5, 11].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => onChange({ fontSize: sz })}
              className={`flex-1 py-1 text-[12px] font-mono tabular-nums rounded-md transition-colors duration-150 cursor-pointer ${
                settings.fontSize === sz
                  ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] font-medium shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                  : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              }`}
            >
              {sz}pt
            </button>
          ))}
        </div>
      </div>

      {/* Spacing & Margins */}
      <div className="space-y-3">
        <label className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
          <MoveVertical className="w-4 h-4 stroke-[1.5]" />
          <span>Spacing & margins</span>
        </label>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[12px] text-[#57534E] dark:text-[#ACA59A]">
            <span>Page margins</span>
            <span className="font-mono tabular-nums">{settings.margin} mm</span>
          </div>
          <div className="flex gap-2">
            {[
              { val: 10, label: 'Compact' },
              { val: 14, label: 'Standard' },
              { val: 18, label: 'Roomy' },
            ].map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => onChange({ margin: m.val })}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg border transition-colors duration-150 cursor-pointer ${
                  settings.margin === m.val
                    ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                    : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] hover:border-[#1C1917]/20'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[12px] text-[#57534E] dark:text-[#ACA59A]">
            <span>Line spacing</span>
            <span className="font-mono tabular-nums">{settings.lineHeight}x</span>
          </div>
          <div className="flex gap-2">
            {[
              { val: 1.25, label: 'Tight' },
              { val: 1.4, label: 'Normal' },
              { val: 1.55, label: 'Relaxed' },
            ].map((lh) => (
              <button
                key={lh.val}
                type="button"
                onClick={() => onChange({ lineHeight: lh.val })}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg border transition-colors duration-150 cursor-pointer ${
                  settings.lineHeight === lh.val
                    ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                    : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] hover:border-[#1C1917]/20'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent Color Palette */}
      <div className="space-y-2.5">
        <label className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
          <Palette className="w-4 h-4 stroke-[1.5]" />
          <span>PDF accent color</span>
        </label>
        <div className="flex items-center gap-2.5 flex-wrap">
          {ACCENT_COLORS.map((c) => {
            const active = settings.accentColor.toLowerCase() === c.hex.toLowerCase()
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => onChange({ accentColor: c.hex })}
                title={c.label}
                aria-label={`Select ${c.label} PDF accent`}
                className={`w-7 h-7 rounded-full transition-colors duration-150 flex items-center justify-center cursor-pointer ${
                  active
                    ? 'ring-2 ring-offset-2 ring-[#0F766E] dark:ring-[#14B8A6] ring-offset-white dark:ring-offset-[#191816]'
                    : 'opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {active && <Check className="w-3.5 h-3.5 text-white stroke-[2]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Smart Page Fit */}
      <div className="pt-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-2.5">
        <label className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
          <Maximize2 className="w-4 h-4 stroke-[1.5]" />
          <span>Page fit</span>
        </label>
        <div className="flex gap-2">
          {[
            { id: 'auto', label: 'Auto' },
            { id: '1-page', label: 'Fit to 1 page' },
            { id: '2-page', label: '2 pages' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ pageFit: p.id as ResumeSettings['pageFit'] })}
              className={`flex-1 py-2 text-[12px] font-medium rounded-lg border transition-colors duration-150 cursor-pointer ${
                settings.pageFit === p.id
                  ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                  : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] hover:border-[#1C1917]/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[#78716C] dark:text-[#8A847A] leading-relaxed">
          Automatically scales margins and line height to keep clean single-page breaks.
        </p>
      </div>
    </div>
  )
}
