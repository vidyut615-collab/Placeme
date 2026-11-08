'use client'

import React from 'react'
import { ProfileData, ResumeDataState } from './types'

interface TemplateProps {
  profile: ProfileData
  resumeData: ResumeDataState
  settings: ResumeDataState['settings']
}

export function formatParagraph(text: string) {
  if (!text) return null
  const clean = text
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
    .join(' ')
  return <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed text-justify">{clean}</p>
}

export function formatBulletPoints(text: string) {
  if (!text) return null
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length > 1 || lines[0]?.startsWith('- ') || lines[0]?.startsWith('• ')) {
    return (
      <ul className="list-disc ml-4 space-y-1 mt-1 text-zinc-700 dark:text-zinc-300">
        {lines.map((line, idx) => {
          const clean = line.replace(/^[-•*]\s*/, '').trim()
          return clean ? <li key={idx} className="leading-relaxed">{clean}</li> : null
        })}
      </ul>
    )
  }

  return <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">{text}</p>
}

export default function ClassicTemplate({ profile, resumeData, settings }: TemplateProps) {
  const fullName = profile.basic?.full_name || profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate Name'
  const email = profile.basic?.email || profile.email
  const phone = profile.basic?.phone || profile.phone
  const linkedin = profile.links?.linkedin
  const github = profile.links?.github
  const portfolio = profile.links?.portfolio

  const contactItems = [email, phone, linkedin, github, portfolio].filter(Boolean)

  const degree = profile.type
  const department = profile.department
  const year = profile.year
  const gpa = profile.gpa

  const skillsLanguages = profile.skills?.languages
  const skillsTools = profile.skills?.tools
  const skillsFrameworks = profile.skills?.frameworks

  const workHistories = resumeData.work_histories || []
  const projects = resumeData.projects || []
  const careerObjective = resumeData.career_objective?.final_edited_text
  const activities = profile.activities || []
  const recognitions = profile.recognitions || []
  const isOnePage = settings.pageFit === '1-page'

  return (
    <div 
      className="w-full bg-white text-zinc-900 select-text font-normal"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}pt`,
        lineHeight: settings.lineHeight,
      }}
    >
      {/* Header */}
      <header className={`text-center ${isOnePage ? 'pb-2' : 'pb-3'} border-b-2`} style={{ borderColor: settings.accentColor }}>
        <h1 
          className="text-2xl font-bold uppercase tracking-wider mb-1"
          style={{ color: settings.accentColor }}
        >
          {fullName}
        </h1>
        {contactItems.length > 0 && (
          <p className="text-[0.85em] text-zinc-600 flex flex-wrap items-center justify-center gap-x-2">
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="opacity-40">•</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </header>

      {/* Main Body */}
      <div className={isOnePage ? "space-y-2.5 pt-1.5" : "space-y-4 pt-3"}>
        {/* Career Objective */}
        {careerObjective && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-1.5"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Career Objective
            </h2>
            <div className="text-[0.92em]">
              {formatParagraph(careerObjective)}
            </div>
          </section>
        )}

        {/* Education */}
        {(degree || department) && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-1.5"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Education
            </h2>
            <div className="flex items-baseline justify-between text-[0.95em]">
              <div>
                <span className="font-semibold text-zinc-900">{degree} in {department}</span>
              </div>
              <div className="text-[0.85em] text-zinc-600 font-medium">
                {year && <span>Class of {year}</span>}
                {gpa && <span className="ml-2 font-semibold">• GPA: {gpa}</span>}
              </div>
            </div>
          </section>
        )}

        {/* Work Experience */}
        {workHistories.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-2"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Work Experience
            </h2>
            <div className={isOnePage ? "space-y-2" : "space-y-3"}>
              {workHistories.map((work, idx) => (
                <div key={idx} className="text-[0.92em]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{work.role}</span>
                      <span className="text-zinc-600 ml-1.5">| {work.company}</span>
                    </div>
                    {(work.start_date || work.end_date) && (
                      <span className="text-[0.85em] text-zinc-500 font-medium">
                        {work.start_date} {work.end_date ? `– ${work.end_date}` : ''}
                      </span>
                    )}
                  </div>
                  {work.tech && (
                    <p className="text-[0.82em] text-zinc-500 italic mt-0.5">
                      Technologies: {work.tech}
                    </p>
                  )}
                  <div className="mt-1">
                    {formatBulletPoints(work.final_edited_text || work.original_description || '')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-2"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Projects
            </h2>
            <div className={isOnePage ? "space-y-2" : "space-y-3"}>
              {projects.map((proj, idx) => (
                <div key={idx} className="text-[0.92em]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{proj.title}</span>
                      {proj.tech && (
                        <span className="text-[0.82em] text-zinc-500 font-medium ml-2 italic">
                          ({proj.tech})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    {formatBulletPoints(proj.final_edited_text || proj.original_description || '')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skillsLanguages || skillsTools || skillsFrameworks) && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-1.5"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Technical Skills
            </h2>
            <div className="text-[0.9em] space-y-1">
              {skillsLanguages && (
                <div>
                  <span className="font-semibold text-zinc-800">Languages: </span>
                  <span className="text-zinc-700">{skillsLanguages}</span>
                </div>
              )}
              {skillsFrameworks && (
                <div>
                  <span className="font-semibold text-zinc-800">Frameworks / Libraries: </span>
                  <span className="text-zinc-700">{skillsFrameworks}</span>
                </div>
              )}
              {skillsTools && (
                <div>
                  <span className="font-semibold text-zinc-800">Tools & Platforms: </span>
                  <span className="text-zinc-700">{skillsTools}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Extracurricular Activities */}
        {activities.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-1.5"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Leadership & Activities
            </h2>
            <div className="space-y-2 text-[0.9em]">
              {activities.map((act, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-medium">
                    <span className="font-semibold text-zinc-800">{act.org} — {act.role}</span>
                    {(act.start_date || act.end_date) && (
                      <span className="text-[0.85em] text-zinc-500">{act.start_date} {act.end_date ? `– ${act.end_date}` : ''}</span>
                    )}
                  </div>
                  {act.description && <p className="text-zinc-600 mt-0.5">{act.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recognitions */}
        {recognitions.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider border-b pb-0.5 mb-1.5"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Honors & Awards
            </h2>
            <div className="space-y-1.5 text-[0.9em]">
              {recognitions.map((rec, idx) => (
                <div key={idx} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-zinc-800">{rec.award}</span>
                    {rec.issuer && <span className="text-zinc-600 ml-1.5">({rec.issuer})</span>}
                  </div>
                  {rec.date && <span className="text-[0.85em] text-zinc-500">{rec.date}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
