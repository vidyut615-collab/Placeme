'use client'

import React from 'react'
import { ProfileData, ResumeDataState } from './types'
import { formatBulletPoints, formatParagraph } from './ClassicTemplate'

interface TemplateProps {
  profile: ProfileData
  resumeData: ResumeDataState
  settings: ResumeDataState['settings']
}

export default function ModernTemplate({ profile, resumeData, settings }: TemplateProps) {
  const fullName = profile.basic?.full_name || profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate Name'
  const email = profile.basic?.email || profile.email
  const phone = profile.basic?.phone || profile.phone
  const linkedin = profile.links?.linkedin
  const github = profile.links?.github
  const portfolio = profile.links?.portfolio

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
      className="w-full bg-white text-zinc-900 select-text flex min-h-full font-normal"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}pt`,
        lineHeight: settings.lineHeight,
      }}
    >
      {/* LEFT COLUMN / SIDEBAR (33%) */}
      <aside 
        className={`w-[33%] ${isOnePage ? 'p-3 space-y-2.5' : 'p-4 space-y-4'} bg-zinc-50 border-r border-zinc-200 flex flex-col`}
        style={{ borderColor: '#e4e4e7' }}
      >
        {/* Contact Info */}
        <section>
          <h2 
            className="text-[0.95em] font-bold uppercase tracking-wider mb-2 pb-1 border-b"
            style={{ color: settings.accentColor, borderColor: settings.accentColor }}
          >
            Contact
          </h2>
          <div className="space-y-1.5 text-[0.88em] text-zinc-700 break-all">
            {email && (
              <div>
                <span className="block text-[0.75em] uppercase font-bold text-zinc-400">Email</span>
                <span>{email}</span>
              </div>
            )}
            {phone && (
              <div>
                <span className="block text-[0.75em] uppercase font-bold text-zinc-400">Phone</span>
                <span>{phone}</span>
              </div>
            )}
            {linkedin && (
              <div>
                <span className="block text-[0.75em] uppercase font-bold text-zinc-400">LinkedIn</span>
                <span className="text-zinc-600 truncate">{linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
            {github && (
              <div>
                <span className="block text-[0.75em] uppercase font-bold text-zinc-400">GitHub</span>
                <span className="text-zinc-600 truncate">{github.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
            {portfolio && (
              <div>
                <span className="block text-[0.75em] uppercase font-bold text-zinc-400">Portfolio</span>
                <span className="text-zinc-600 truncate">{portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </div>
            )}
          </div>
        </section>

        {/* Education */}
        {(degree || department) && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-wider mb-2 pb-1 border-b"
              style={{ color: settings.accentColor, borderColor: settings.accentColor }}
            >
              Education
            </h2>
            <div className="text-[0.88em] space-y-1">
              <p className="font-bold text-zinc-900">{degree}</p>
              <p className="text-zinc-700">{department}</p>
              {year && <p className="text-zinc-500 text-[0.82em]">Graduation: {year}</p>}
              {gpa && <p className="text-zinc-700 text-[0.82em] font-semibold">GPA: {gpa}</p>}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skillsLanguages || skillsTools || skillsFrameworks) && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-wider mb-2 pb-1 border-b"
              style={{ color: settings.accentColor, borderColor: settings.accentColor }}
            >
              Skills
            </h2>
            <div className="space-y-2 text-[0.86em]">
              {skillsLanguages && (
                <div>
                  <span className="block font-semibold text-zinc-800 text-[0.82em] uppercase text-zinc-500">Languages</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skillsLanguages.split(',').map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[0.82em]">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skillsFrameworks && (
                <div>
                  <span className="block font-semibold text-zinc-800 text-[0.82em] uppercase text-zinc-500">Frameworks</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skillsFrameworks.split(',').map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[0.82em]">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skillsTools && (
                <div>
                  <span className="block font-semibold text-zinc-800 text-[0.82em] uppercase text-zinc-500">Tools</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skillsTools.split(',').map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[0.82em]">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recognitions */}
        {recognitions.length > 0 && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-wider mb-2 pb-1 border-b"
              style={{ color: settings.accentColor, borderColor: settings.accentColor }}
            >
              Awards
            </h2>
            <div className="space-y-1.5 text-[0.85em]">
              {recognitions.map((rec, idx) => (
                <div key={idx}>
                  <p className="font-semibold text-zinc-800">{rec.award}</p>
                  {rec.issuer && <p className="text-zinc-500 text-[0.8em]">{rec.issuer} {rec.date && `(${rec.date})`}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>

      {/* RIGHT COLUMN / MAIN BODY (67%) */}
      <main className={`w-[67%] ${isOnePage ? 'p-3 space-y-2.5' : 'p-5 space-y-4'}`}>
        {/* Name Header */}
        <header className="border-b pb-3" style={{ borderColor: settings.accentColor }}>
          <h1 
            className="text-2xl font-bold tracking-tight uppercase"
            style={{ color: settings.accentColor }}
          >
            {fullName}
          </h1>
          {degree && (
            <p className="text-[0.9em] text-zinc-600 font-medium mt-0.5">
              {degree} Candidate in {department}
            </p>
          )}
        </header>

        {/* Career Objective */}
        {careerObjective && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider mb-1.5 pb-0.5 border-b"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Professional Summary
            </h2>
            <div className="text-[0.92em]">
              {formatParagraph(careerObjective)}
            </div>
          </section>
        )}

        {/* Experience */}
        {workHistories.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider mb-2 pb-0.5 border-b"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Experience
            </h2>
            <div className={isOnePage ? "space-y-2" : "space-y-3"}>
              {workHistories.map((work, idx) => (
                <div key={idx} className="text-[0.92em]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{work.role}</span>
                      <span className="text-zinc-600 ml-1">· {work.company}</span>
                    </div>
                    {(work.start_date || work.end_date) && (
                      <span className="text-[0.82em] text-zinc-500 font-medium">
                        {work.start_date} {work.end_date ? `– ${work.end_date}` : ''}
                      </span>
                    )}
                  </div>
                  {work.tech && (
                    <p className="text-[0.8em] text-zinc-500 italic">
                      Tech: {work.tech}
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
              className="text-[1.05em] font-bold uppercase tracking-wider mb-2 pb-0.5 border-b"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Featured Projects
            </h2>
            <div className={isOnePage ? "space-y-2" : "space-y-3"}>
              {projects.map((proj, idx) => (
                <div key={idx} className="text-[0.92em]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{proj.title}</span>
                      {proj.tech && (
                        <span className="text-[0.8em] text-zinc-500 font-medium ml-2 italic">
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

        {/* Activities */}
        {activities.length > 0 && (
          <section>
            <h2 
              className="text-[1.05em] font-bold uppercase tracking-wider mb-1.5 pb-0.5 border-b"
              style={{ color: settings.accentColor, borderColor: '#e4e4e7' }}
            >
              Extracurricular Activities
            </h2>
            <div className="space-y-2 text-[0.88em]">
              {activities.map((act, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-medium">
                    <span className="font-semibold text-zinc-800">{act.org} — {act.role}</span>
                    {(act.start_date || act.end_date) && (
                      <span className="text-[0.8em] text-zinc-500">{act.start_date} {act.end_date ? `– ${act.end_date}` : ''}</span>
                    )}
                  </div>
                  {act.description && <p className="text-zinc-600 mt-0.5">{act.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
