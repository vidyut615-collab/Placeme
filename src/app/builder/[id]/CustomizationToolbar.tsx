'use client'

import React from 'react'
import { ResumeSettings } from './templates/types'
import { Layout, Type, Palette, MoveVertical, Maximize2, Check } from 'lucide-react'

interface CustomizationToolbarProps {
  settings: ResumeSettings
  onChange: (updated: Partial<ResumeSettings>) => void
}

const TEMPLATES: Array<{ id: ResumeSettings['template']; name: string; desc: string }> = [
  { id: 'classic', name: 'Classic ATS', desc: 'Single-column, high parseability' },
  { id: 'modern', name: 'Modern Split', desc: 'Two-column with stylish sidebar' },
  { id: 'executive', name: 'Executive', desc: 'Minimalist, refined typography' },
]

const FONTS = [
  { id: 'Inter, sans-serif', name: 'Inter (Clean Sans)' },
  { id: 'Roboto, sans-serif', name: 'Roboto (Modern)' },
  { id: 'Merriweather, serif', name: 'Merriweather (Classic Serif)' },
  { id: 'Outfit, sans-serif', name: 'Outfit (Contemporary)' },
  { id: 'Georgia, serif', name: 'Georgia (Editorial)' },
]

const ACCENT_COLORS = [
  { hex: '#1e3a8a', label: 'Navy' },
  { hex: '#1e293b', label: 'Charcoal' },
  { hex: '#047857', label: 'Emerald' },
  { hex: '#991b1b', label: 'Burgundy' },
  { hex: '#6b21a8', label: 'Purple' },
  { hex: '#0284c7', label: 'Sky' },
]

export default function CustomizationToolbar({ settings, onChange }: CustomizationToolbarProps) {
  return (
    <div className="p-6 space-y-6 text-sm">
      {/* Template Chooser */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
          <Layout className="w-3.5 h-3.5" /> Resume Template
        </label>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map(tmpl => {
            const isSelected = settings.template === tmpl.id
            return (
              <button
                key={tmpl.id}
                onClick={() => onChange({ template: tmpl.id })}
                className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{tmpl.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{tmpl.desc}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
          <Type className="w-3.5 h-3.5" /> Typography & Font
        </label>
        
        {/* Font Family Dropdown */}
        <select
          value={settings.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500 mb-3"
        >
          {FONTS.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        {/* Font Size Buttons */}
        <div className="flex items-center justify-between gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-lg">
          <span className="text-xs font-medium text-zinc-500 px-2">Size</span>
          {[9, 9.5, 10, 10.5, 11].map(sz => (
            <button
              key={sz}
              onClick={() => onChange({ fontSize: sz })}
              className={`flex-1 py-1 text-xs font-medium rounded transition-all ${
                settings.fontSize === sz 
                  ? 'bg-white dark:bg-zinc-900 shadow-sm font-bold text-blue-600' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {sz}pt
            </button>
          ))}
        </div>
      </div>

      {/* Spacing & Margins */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
          <MoveVertical className="w-3.5 h-3.5" /> Spacing & Margins
        </label>

        {/* Margins */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Page Margins</span>
            <span>{settings.margin} mm</span>
          </div>
          <div className="flex gap-2">
            {[
              { val: 10, label: 'Compact' },
              { val: 14, label: 'Standard' },
              { val: 18, label: 'Roomy' },
            ].map(m => (
              <button
                key={m.val}
                onClick={() => onChange({ margin: m.val })}
                className={`flex-1 py-1.5 text-xs rounded border transition-all ${
                  settings.margin === m.val
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Line Height */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Line Spacing</span>
            <span>{settings.lineHeight}x</span>
          </div>
          <div className="flex gap-2">
            {[
              { val: 1.25, label: 'Tight' },
              { val: 1.4, label: 'Normal' },
              { val: 1.55, label: 'Relaxed' },
            ].map(lh => (
              <button
                key={lh.val}
                onClick={() => onChange({ lineHeight: lh.val })}
                className={`flex-1 py-1.5 text-xs rounded border transition-all ${
                  settings.lineHeight === lh.val
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent Color Palette */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
          <Palette className="w-3.5 h-3.5" /> Accent Color
        </label>
        <div className="flex items-center gap-3">
          {ACCENT_COLORS.map(c => (
            <button
              key={c.hex}
              onClick={() => onChange({ accentColor: c.hex })}
              title={c.label}
              className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                settings.accentColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {settings.accentColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Page Fit */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2.5">
          <Maximize2 className="w-3.5 h-3.5" /> Smart Page Fit
        </label>
        <div className="flex gap-2">
          {[
            { id: 'auto', label: 'Auto' },
            { id: '1-page', label: 'Fit to 1 Page' },
            { id: '2-page', label: '2 Pages' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => onChange({ pageFit: p.id as any })}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                settings.pageFit === p.id
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[0.72rem] text-zinc-400 mt-1.5">
          Automatically scales padding and font size to eliminate awkward orphan overflow lines.
        </p>
      </div>
    </div>
  )
}
