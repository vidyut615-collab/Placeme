import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font
} from '@react-pdf/renderer'
import { ProfileData, ResumeDataState, ResumeSettings } from '../templates/types'

interface ResumePDFDocumentProps {
  profile: ProfileData
  resumeData: ResumeDataState
  settings?: ResumeSettings
}

export default function ResumePDFDocument({
  profile,
  resumeData,
  settings = resumeData.settings
}: ResumePDFDocumentProps) {
  const accentColor = settings?.accentColor || '#1e3a8a'
  const baseFontSize = settings?.fontSize || 10
  const lineHeight = settings?.lineHeight || 1.35
  const marginMm = settings?.margin || 14
  // Convert mm to pt (1mm ≈ 2.83465pt)
  const paddingPt = Math.round(marginMm * 2.835)

  // Extract candidate profile details
  const basic = profile.basic || {}
  const fullName = basic.full_name || profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate Name'
  const email = basic.email || profile.email || ''
  const phone = basic.phone || profile.phone || ''
  const rawLinkedin = resumeData.profile_overrides?.linkedin || profile.links?.linkedin || ''
  const cleanLinkedin = rawLinkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const github = profile.links?.github ? profile.links.github.replace(/^https?:\/\/(www\.)?/, '') : ''
  const portfolio = profile.links?.portfolio ? profile.links.portfolio.replace(/^https?:\/\/(www\.)?/, '') : ''

  // Education details
  const education = [
    profile.type,
    profile.department ? `in ${profile.department}` : '',
    profile.year ? `(Class of ${profile.year})` : '',
    profile.gpa ? `· GPA: ${profile.gpa}` : ''
  ].filter(Boolean).join(' ')

  // Work experiences and projects from resumeData
  const workHistories = resumeData.work_histories || []
  const projects = resumeData.projects || []
  const careerObjective = resumeData.career_objective?.final_edited_text || ''

  // Skills
  const skills = profile.skills || {}
  const hasSkills = !!(skills.languages || skills.frameworks || skills.tools)

  // Activities & Recognitions
  const activities = profile.activities || []
  const recognitions = profile.recognitions || []

  // Create dynamic styles based on settings
  const styles = StyleSheet.create({
    page: {
      padding: paddingPt,
      backgroundColor: '#ffffff',
      color: '#18181b',
      fontSize: baseFontSize,
      lineHeight: lineHeight,
      fontFamily: 'Helvetica'
    },
    header: {
      marginBottom: 12,
      textAlign: 'center'
    },
    name: {
      fontSize: baseFontSize + 9,
      fontWeight: 'bold',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: '#09090b',
      marginBottom: 4
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
      fontSize: baseFontSize - 1.5,
      color: '#52525b'
    },
    contactItem: {
      color: '#3f3f46',
      textDecoration: 'none'
    },
    contactSeparator: {
      color: '#a1a1aa'
    },
    section: {
      marginTop: 9,
      marginBottom: 4
    },
    sectionTitle: {
      fontSize: baseFontSize + 1,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: accentColor,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#d4d4d8',
      borderBottomStyle: 'solid',
      marginBottom: 6
    },
    entryContainer: {
      marginBottom: 7
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2
    },
    entryTitleRole: {
      fontSize: baseFontSize,
      fontWeight: 'bold',
      color: '#09090b'
    },
    entryCompanyOrTech: {
      fontSize: baseFontSize - 0.5,
      color: '#52525b',
      fontStyle: 'italic'
    },
    entryDates: {
      fontSize: baseFontSize - 1.5,
      color: '#71717a'
    },
    bulletRow: {
      flexDirection: 'row',
      marginTop: 2,
      paddingLeft: 4
    },
    bulletDot: {
      width: 10,
      fontSize: baseFontSize,
      color: '#52525b'
    },
    bulletText: {
      flex: 1,
      fontSize: baseFontSize - 0.5,
      color: '#27272a',
      lineHeight: lineHeight
    },
    paragraphText: {
      fontSize: baseFontSize - 0.5,
      color: '#27272a',
      lineHeight: lineHeight
    },
    skillRow: {
      flexDirection: 'row',
      marginTop: 2.5
    },
    skillLabel: {
      fontWeight: 'bold',
      fontSize: baseFontSize - 0.5,
      color: '#09090b',
      width: 120
    },
    skillValue: {
      flex: 1,
      fontSize: baseFontSize - 0.5,
      color: '#3f3f46'
    }
  })

  // Helper to split text into bullet lines
  const parseBullets = (text: string): string[] => {
    if (!text) return []
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
  }

  return (
    <Document title={`${fullName} - Resume`}>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER: NAME & CONTACT */}
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.contactRow}>
            {email ? (
              <Link src={`mailto:${email}`} style={styles.contactItem}>
                <Text>{email}</Text>
              </Link>
            ) : null}

            {phone ? (
              <>
                {email ? <Text style={styles.contactSeparator}>·</Text> : null}
                <Text style={styles.contactItem}>{phone}</Text>
              </>
            ) : null}

            {cleanLinkedin ? (
              <>
                {(email || phone) ? <Text style={styles.contactSeparator}>·</Text> : null}
                <Link src={`https://${cleanLinkedin}`} style={styles.contactItem}>
                  <Text>{cleanLinkedin}</Text>
                </Link>
              </>
            ) : null}

            {github ? (
              <>
                {(email || phone || cleanLinkedin) ? <Text style={styles.contactSeparator}>·</Text> : null}
                <Link src={`https://${github}`} style={styles.contactItem}>
                  <Text>{github}</Text>
                </Link>
              </>
            ) : null}

            {portfolio ? (
              <>
                {(email || phone || cleanLinkedin || github) ? <Text style={styles.contactSeparator}>·</Text> : null}
                <Link src={`https://${portfolio}`} style={styles.contactItem}>
                  <Text>{portfolio}</Text>
                </Link>
              </>
            ) : null}
          </View>
        </View>

        {/* CAREER OBJECTIVE */}
        {careerObjective ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Objective</Text>
            {parseBullets(careerObjective).length > 1 ? (
              parseBullets(careerObjective).map((b, bi) => (
                <View key={bi} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.paragraphText}>{careerObjective}</Text>
            )}
          </View>
        ) : null}

        {/* EDUCATION */}
        {education ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.entryContainer}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitleRole}>
                  {profile.type ? `${profile.type}${profile.department ? ` in ${profile.department}` : ''}` : 'Degree'}
                </Text>
                <Text style={styles.entryDates}>
                  {[profile.year ? `Class of ${profile.year}` : '', profile.gpa ? `GPA: ${profile.gpa}` : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* WORK EXPERIENCE */}
        {workHistories.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workHistories.map((work, wi) => {
              const bullets = parseBullets(work.final_edited_text || work.original_description || '')
              const dateRange = [work.start_date, work.end_date || 'Present'].filter(Boolean).join(' – ')
              return (
                <View key={wi} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.entryTitleRole}>{work.role || 'Role'}</Text>
                      {work.company ? (
                        <Text style={styles.entryCompanyOrTech}>| {work.company}</Text>
                      ) : null}
                    </View>
                    {dateRange ? <Text style={styles.entryDates}>{dateRange}</Text> : null}
                  </View>

                  {work.tech ? (
                    <Text style={{ fontSize: baseFontSize - 1.5, color: '#52525b', fontStyle: 'italic', marginBottom: 2 }}>
                      Technologies: {work.tech}
                    </Text>
                  ) : null}

                  {bullets.map((bullet, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {/* PROJECTS */}
        {projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, pi) => {
              const bullets = parseBullets(proj.final_edited_text || proj.original_description || '')
              return (
                <View key={pi} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.entryTitleRole}>{proj.title || 'Project'}</Text>
                      {proj.tech ? (
                        <Text style={styles.entryCompanyOrTech}>({proj.tech})</Text>
                      ) : null}
                    </View>
                  </View>

                  {bullets.map((bullet, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {/* TECHNICAL SKILLS */}
        {hasSkills ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {skills.languages ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>Languages:</Text>
                <Text style={styles.skillValue}>{skills.languages}</Text>
              </View>
            ) : null}
            {skills.frameworks ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>Frameworks / Libraries:</Text>
                <Text style={styles.skillValue}>{skills.frameworks}</Text>
              </View>
            ) : null}
            {skills.tools ? (
              <View style={styles.skillRow}>
                <Text style={styles.skillLabel}>Tools & Platforms:</Text>
                <Text style={styles.skillValue}>{skills.tools}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ACTIVITIES & LEADERSHIP */}
        {activities.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities & Leadership</Text>
            {activities.map((act, ai) => (
              <View key={ai} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleRole}>{act.role || 'Role'} · {act.org || 'Organization'}</Text>
                  <Text style={styles.entryDates}>{[act.start_date, act.end_date].filter(Boolean).join(' – ')}</Text>
                </View>
                {act.description ? (
                  <Text style={styles.paragraphText}>{act.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* AWARDS & RECOGNITIONS */}
        {recognitions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards & Recognitions</Text>
            {recognitions.map((rec, ri) => (
              <View key={ri} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleRole}>{rec.award || 'Award'}</Text>
                  <Text style={styles.entryDates}>{[rec.issuer, rec.date].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

      </Page>
    </Document>
  )
}
