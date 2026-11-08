'use client'

import React from 'react'
import { ProfileData, ResumeDataState } from './types'
import { formatBulletPoints, formatParagraph } from './ClassicTemplate'

interface TemplateProps {
  profile: ProfileData
  resumeData: ResumeDataState
  settings: ResumeDataState['settings']
}

export default function ExecutiveTemplate({ profile, resumeData, settings }: TemplateProps) {
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
      className="w-full bg-white text-zinc-900 select-text p-1 font-normal"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}pt`,
        lineHeight: settings.lineHeight,
      }}
    >
      {/* Top Header */}
      <header className={`border-b ${isOnePage ? 'pb-2.5 mb-2.5' : 'pb-4 mb-4'}`} style={{ borderColor: '#d4d4d8' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
          <div>
            <h1 
              className="text-3xl font-extrabold tracking-tight uppercase"
              style={{ color: settings.accentColor }}
            >
              {fullName}
            </h1>
            {degree && (
              <p className="text-[0.9em] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                {degree} · {department}
              </p>
            )}
          </div>
          <div className="text-right text-[0.82em] text-zinc-600 space-y-0.5">
            {email && <p>{email}</p>}
            {phone && <p>{phone}</p>}
            {linkedin && <p className="text-zinc-500">{linkedin.replace(/^https?:\/\/(www\.)?/, '')}</p>}
            {github && <p className="text-zinc-500">{github.replace(/^https?:\/\/(www\.)?/, '')}</p>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={isOnePage ? "space-y-2.5" : "space-y-4"}>
        {/* Executive Summary */}
        {careerObjective && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-1"
            >
              Executive Summary
            </h2>
            <div className="text-[0.92em] text-zinc-700">
              {formatParagraph(careerObjective)}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {workHistories.length > 0 && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-2"
            >
              Professional Experience
            </h2>
            <div className={isOnePage ? "space-y-2" : "space-y-3"}>
              {workHistories.map((work, idx) => (
                <div key={idx} className="text-[0.92em]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-zinc-900">{work.role}</span>
                      <span className="text-zinc-600 ml-1.5 font-medium">— {work.company}</span>
                    </div>
                    {(work.start_date || work.end_date) && (
                      <span className="text-[0.85em] text-zinc-500 font-mono">
                        {work.start_date} {work.end_date ? `– ${work.end_date}` : ''}
                      </span>
                    )}
                  </div>
                  {work.tech && (
                    <p className="text-[0.82em] text-zinc-500 italic mt-0.5">
                      Tech stack: {work.tech}
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
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-2"
            >
              Selected Projects
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

        {/* Education */}
        {(degree || department) && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-1.5"
            >
              Academic Background
            </h2>
            <div className="flex items-baseline justify-between text-[0.92em]">
              <div>
                <span className="font-bold text-zinc-900">{degree}</span>
                <span className="text-zinc-600 ml-1">in {department}</span>
              </div>
              <div className="text-[0.85em] text-zinc-500">
                {year && <span>{year}</span>}
                {gpa && <span className="ml-2 font-medium">· GPA: {gpa}</span>}
              </div>
            </div>
          </section>
        )}

        {/* Skills */}
        {(skillsLanguages || skillsTools || skillsFrameworks) && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-1.5"
            >
              Core Competencies
            </h2>
            <div className="text-[0.9em] space-y-1">
              {skillsLanguages && (
                <p><span className="font-semibold text-zinc-800">Programming:</span> <span className="text-zinc-600">{skillsLanguages}</span></p>
              )}
              {skillsFrameworks && (
                <p><span className="font-semibold text-zinc-800">Frameworks:</span> <span className="text-zinc-600">{skillsFrameworks}</span></p>
              )}
              {skillsTools && (
                <p><span className="font-semibold text-zinc-800">Tools:</span> <span className="text-zinc-600">{skillsTools}</span></p>
              )}
            </div>
          </section>
        )}

        {/* Recognitions & Activities */}
        {(recognitions.length > 0 || activities.length > 0) && (
          <section>
            <h2 
              className="text-[0.95em] font-bold uppercase tracking-widest text-zinc-400 mb-1.5"
            >
              Honors & Leadership
            </h2>
            <div className="space-y-1.5 text-[0.88em]">
              {recognitions.map((rec, idx) => (
                <div key={`rec-${idx}`} className="flex justify-between">
                  <span className="font-semibold text-zinc-800">{rec.award} {rec.issuer && <span className="font-normal text-zinc-600">({rec.issuer})</span>}</span>
                  {rec.date && <span className="text-zinc-500">{rec.date}</span>}
                </div>
              ))}
              {activities.map((act, idx) => (
                <div key={`act-${idx}`} className="flex justify-between">
                  <span className="font-semibold text-zinc-800">{act.org} — {act.role}</span>
                  {act.start_date && <span className="text-zinc-500">{act.start_date} {act.end_date ? `– ${act.end_date}` : ''}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
