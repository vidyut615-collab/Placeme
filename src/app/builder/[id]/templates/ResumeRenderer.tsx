'use client'

import React from 'react'
import { ProfileData, ResumeDataState, ResumeSettings } from './types'
import ClassicTemplate from './ClassicTemplate'
import ModernTemplate from './ModernTemplate'
import ExecutiveTemplate from './ExecutiveTemplate'

interface RendererProps {
  profile: ProfileData
  resumeData: ResumeDataState
  settings: ResumeSettings
  scale?: number
}

export default function ResumeRenderer({ profile, resumeData, settings, scale = 1 }: RendererProps) {
  // Merge profile overrides (e.g. cleaned LinkedIn) onto profile
  const effectiveProfile: ProfileData = {
    ...profile,
    links: {
      ...profile.links,
      ...(resumeData.profile_overrides?.linkedin ? { linkedin: resumeData.profile_overrides.linkedin } : {})
    }
  }

  // Calculate dynamic fit adjustments if '1-page' is selected or by default for standard graduate profiles
  const totalEntries = (resumeData.work_histories?.length || 0) + (resumeData.projects?.length || 0)
  const isOnePage = settings.pageFit === '1-page' || (settings.pageFit === 'auto' && totalEntries <= 4)

  const effectiveFontSize = isOnePage ? Math.max(8.8, Math.round(settings.fontSize * 0.91 * 10) / 10) : settings.fontSize
  const effectiveMargin = isOnePage ? Math.max(8, settings.margin - 4) : settings.margin
  const effectiveLineHeight = isOnePage ? 1.25 : settings.lineHeight

  const effectiveSettings: ResumeSettings = {
    ...settings,
    fontSize: effectiveFontSize,
    margin: effectiveMargin,
    lineHeight: effectiveLineHeight,
    pageFit: isOnePage ? '1-page' : settings.pageFit
  }

  // Render template based on settings.template
  const renderTemplate = () => {
    switch (settings.template) {
      case 'modern':
        return <ModernTemplate profile={effectiveProfile} resumeData={resumeData} settings={effectiveSettings} />
      case 'executive':
        return <ExecutiveTemplate profile={effectiveProfile} resumeData={resumeData} settings={effectiveSettings} />
      case 'classic':
      default:
        return <ClassicTemplate profile={effectiveProfile} resumeData={resumeData} settings={effectiveSettings} />
    }
  }

  return (
    <div className="resume-print-wrapper flex flex-col items-center">
      {/* A4 Paper Container */}
      <div 
        id="resume-canvas-a4"
        className="resume-a4-sheet bg-white shadow-2xl border border-zinc-200 transition-all select-text overflow-hidden relative"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: `${effectiveMargin}mm`,
          fontFamily: settings.fontFamily,
          boxSizing: 'border-box',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
        }}
      >
        {renderTemplate()}
      </div>

      {/* Embedded print stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all UI elements except the resume paper */
          header, nav, aside, .no-print, button, .builder-sidebar, .builder-editor {
            display: none !important;
          }
          .resume-print-wrapper {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .resume-a4-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: 100vh !important;
            transform: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
