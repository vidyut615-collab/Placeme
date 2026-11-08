import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link
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
  const template = settings?.template || 'classic'
  const accentColor = settings?.accentColor || '#1e3a8a'
  const baseFontSize = settings?.fontSize || 10
  const lineHeight = settings?.lineHeight || 1.35
  const marginMm = settings?.margin || 14
  const paddingPt = Math.round(marginMm * 2.835)

  // Determine font family (Times-Roman for serif fonts, Helvetica for sans-serif)
  const isSerif = settings?.fontFamily?.toLowerCase().includes('serif')
  const baseFont = isSerif ? 'Times-Roman' : 'Helvetica'
  const boldFont = isSerif ? 'Times-Bold' : 'Helvetica-Bold'
  const italicFont = isSerif ? 'Times-Italic' : 'Helvetica-Oblique'

  // Extract profile details
  const basic = profile.basic || {}
  const fullName = basic.full_name || profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate Name'
  const email = basic.email || profile.email || ''
  const phone = basic.phone || profile.phone || ''
  const rawLinkedin = resumeData.profile_overrides?.linkedin || profile.links?.linkedin || ''
  const cleanLinkedin = rawLinkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const github = profile.links?.github ? profile.links.github.replace(/^https?:\/\/(www\.)?/, '') : ''
  const portfolio = profile.links?.portfolio ? profile.links.portfolio.replace(/^https?:\/\/(www\.)?/, '') : ''

  const degree = profile.type
  const department = profile.department
  const year = profile.year
  const gpa = profile.gpa

  const workHistories = resumeData.work_histories || []
  const projects = resumeData.projects || []
  const careerObjective = resumeData.career_objective?.final_edited_text || ''

  const skills = profile.skills || {}
  const hasSkills = !!(skills.languages || skills.frameworks || skills.tools)

  const activities = profile.activities || []
  const recognitions = profile.recognitions || []

  // Helper to parse bullet text
  const parseBullets = (text: string): string[] => {
    if (!text) return []
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
  }

  // Helper to format paragraph text (cleans bullets/newlines into a single cohesive paragraph)
  const formatParagraph = (text: string): string => {
    if (!text) return ''
    return text
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
      .join(' ')
  }

  // ==========================================
  // SMART 1-PAGE FIT ENGINE
  // ==========================================
  const pageFit = settings?.pageFit || 'auto'
  const totalEntries = workHistories.length + projects.length
  const objectiveWords = careerObjective ? careerObjective.split(/\s+/).filter(Boolean).length : 0

  // Standard 1-page fit applies when user selects '1-page' OR by default on standard profiles (<= 4 entries)
  const isOnePage = pageFit === '1-page' || (pageFit === 'auto' && totalEntries <= 4)

  // Compress spacing & font proportionally if content is dense so it never spills to page 2
  const fitScale = isOnePage
    ? (totalEntries >= 5 || objectiveWords > 75 ? 0.86 : (totalEntries >= 4 || objectiveWords > 50 ? 0.90 : 0.94))
    : 1.0

  const effFontSize = Math.round(baseFontSize * fitScale * 10) / 10
  const effLineHeight = isOnePage ? 1.22 : lineHeight

  // Padding (Page margins): reduce from ~40pt (14mm) down to ~22-26pt (8-9mm)
  const effPaddingPt = isOnePage 
    ? Math.max(18, Math.min(26, Math.round(paddingPt * 0.62)))
    : paddingPt

  const spacing = {
    headerMarginBottom: isOnePage ? 6 : 10,
    sectionMarginTop: isOnePage ? (totalEntries >= 4 ? 4 : 5) : 8,
    sectionMarginBottom: isOnePage ? 1 : 3,
    sectionTitleMarginBottom: isOnePage ? 2.5 : 5,
    sectionTitlePaddingBottom: isOnePage ? 1.5 : 2,
    entryMarginBottom: isOnePage ? (totalEntries >= 4 ? 2.5 : 3.5) : 6,
    bulletMarginTop: isOnePage ? 0.8 : 1.5,
    bulletPaddingLeft: isOnePage ? 2 : 4,
    skillRowMarginTop: isOnePage ? 1.2 : 2,
  }

  // ==========================================
  // TEMPLATE 1: CLASSIC ATS (1-COLUMN CENTERED)
  // ==========================================
  const renderClassic = () => {
    const s = StyleSheet.create({
      page: {
        padding: effPaddingPt,
        backgroundColor: '#ffffff',
        color: '#18181b',
        fontSize: effFontSize,
        lineHeight: effLineHeight,
        fontFamily: baseFont
      },
      header: {
        marginBottom: spacing.headerMarginBottom,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: accentColor,
        borderBottomStyle: 'solid',
        paddingBottom: isOnePage ? 4 : 6
      },
      name: {
        fontSize: effFontSize + (isOnePage ? 7 : 9),
        fontFamily: boldFont,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: accentColor,
        marginBottom: isOnePage ? 2 : 3
      },
      contactRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: isOnePage ? 4 : 6,
        fontSize: effFontSize - 1.5,
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
        marginTop: spacing.sectionMarginTop,
        marginBottom: spacing.sectionMarginBottom
      },
      sectionTitle: {
        fontSize: effFontSize + (isOnePage ? 0.5 : 0.8),
        fontFamily: boldFont,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: accentColor,
        paddingBottom: spacing.sectionTitlePaddingBottom,
        borderBottomWidth: 1,
        borderBottomColor: '#e4e4e7',
        borderBottomStyle: 'solid',
        marginBottom: spacing.sectionTitleMarginBottom
      },
      entryContainer: {
        marginBottom: spacing.entryMarginBottom
      },
      entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 1
      },
      entryTitle: {
        fontSize: effFontSize,
        fontFamily: boldFont,
        color: '#09090b'
      },
      entrySubtitle: {
        fontSize: effFontSize - 0.5,
        color: '#52525b',
        fontFamily: italicFont
      },
      entryDates: {
        fontSize: effFontSize - 1.5,
        color: '#71717a'
      },
      bulletRow: {
        flexDirection: 'row',
        marginTop: spacing.bulletMarginTop,
        paddingLeft: spacing.bulletPaddingLeft
      },
      bulletDot: {
        width: isOnePage ? 7 : 10,
        fontSize: effFontSize,
        color: '#52525b'
      },
      bulletText: {
        flex: 1,
        fontSize: effFontSize - 0.5,
        color: '#27272a',
        lineHeight: effLineHeight
      },
      paragraphText: {
        fontSize: effFontSize - 0.5,
        color: '#27272a',
        lineHeight: effLineHeight,
        textAlign: 'justify',
        marginTop: isOnePage ? 1 : 2
      },
      skillRow: {
        flexDirection: 'row',
        marginTop: spacing.skillRowMarginTop
      },
      skillLabel: {
        fontFamily: boldFont,
        fontSize: effFontSize - 0.5,
        color: '#09090b',
        width: isOnePage ? 115 : 130
      },
      skillValue: {
        flex: 1,
        fontSize: effFontSize - 0.5,
        color: '#3f3f46'
      }
    })

    return (
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{fullName}</Text>
          <View style={s.contactRow}>
            {email ? <Link src={`mailto:${email}`} style={s.contactItem}><Text>{email}</Text></Link> : null}
            {phone ? (
              <>
                {email ? <Text style={s.contactSeparator}>•</Text> : null}
                <Text style={s.contactItem}>{phone}</Text>
              </>
            ) : null}
            {cleanLinkedin ? (
              <>
                {(email || phone) ? <Text style={s.contactSeparator}>•</Text> : null}
                <Link src={`https://${cleanLinkedin}`} style={s.contactItem}><Text>{cleanLinkedin}</Text></Link>
              </>
            ) : null}
            {github ? (
              <>
                {(email || phone || cleanLinkedin) ? <Text style={s.contactSeparator}>•</Text> : null}
                <Link src={`https://${github}`} style={s.contactItem}><Text>{github}</Text></Link>
              </>
            ) : null}
            {portfolio ? (
              <>
                {(email || phone || cleanLinkedin || github) ? <Text style={s.contactSeparator}>•</Text> : null}
                <Link src={`https://${portfolio}`} style={s.contactItem}><Text>{portfolio}</Text></Link>
              </>
            ) : null}
          </View>
        </View>

        {careerObjective ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Career Objective</Text>
            <Text style={s.paragraphText}>
              {formatParagraph(careerObjective)}
            </Text>
          </View>
        ) : null}

        {(degree || department) ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Education</Text>
            <View style={s.entryContainer}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{degree}{department ? ` in ${department}` : ''}</Text>
                <Text style={s.entryDates}>{[year ? `Class of ${year}` : '', gpa ? `GPA: ${gpa}` : ''].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {workHistories.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Work Experience</Text>
            {workHistories.map((work, wi) => {
              const bullets = parseBullets(work.final_edited_text || work.original_description || '')
              const dateRange = [work.start_date, work.end_date || 'Present'].filter(Boolean).join(' – ')
              return (
                <View key={wi} style={s.entryContainer}>
                  <View style={s.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={s.entryTitle}>{work.role || 'Role'}</Text>
                      {work.company ? <Text style={s.entrySubtitle}>| {work.company}</Text> : null}
                    </View>
                    {dateRange ? <Text style={s.entryDates}>{dateRange}</Text> : null}
                  </View>
                  {work.tech ? (
                    <Text style={{ fontSize: baseFontSize - 1.5, color: '#52525b', fontFamily: italicFont, marginBottom: 1 }}>
                      Technologies: {work.tech}
                    </Text>
                  ) : null}
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Projects</Text>
            {projects.map((proj, pi) => {
              const bullets = parseBullets(proj.final_edited_text || proj.original_description || '')
              return (
                <View key={pi} style={s.entryContainer}>
                  <View style={s.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={s.entryTitle}>{proj.title || 'Project'}</Text>
                      {proj.tech ? <Text style={s.entrySubtitle}>({proj.tech})</Text> : null}
                    </View>
                  </View>
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {hasSkills ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Technical Skills</Text>
            {skills.languages ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Languages:</Text>
                <Text style={s.skillValue}>{skills.languages}</Text>
              </View>
            ) : null}
            {skills.frameworks ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Frameworks / Libraries:</Text>
                <Text style={s.skillValue}>{skills.frameworks}</Text>
              </View>
            ) : null}
            {skills.tools ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Tools & Platforms:</Text>
                <Text style={s.skillValue}>{skills.tools}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activities.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Activities & Leadership</Text>
            {activities.map((act, ai) => (
              <View key={ai} style={s.entryContainer}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{act.role || 'Role'} · {act.org || 'Organization'}</Text>
                  <Text style={s.entryDates}>{[act.start_date, act.end_date].filter(Boolean).join(' – ')}</Text>
                </View>
                {act.description ? <Text style={{ fontSize: baseFontSize - 0.5, color: '#3f3f46' }}>{act.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {recognitions.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Awards & Recognitions</Text>
            {recognitions.map((rec, ri) => (
              <View key={ri} style={s.entryContainer}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{rec.award || 'Award'}</Text>
                  <Text style={s.entryDates}>{[rec.issuer, rec.date].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    )
  }

  // ==========================================
  // TEMPLATE 2: MODERN SPLIT (2-COLUMN SIDEBAR)
  // ==========================================
  const renderModern = () => {
    const s = StyleSheet.create({
      page: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        color: '#18181b',
        fontSize: effFontSize,
        lineHeight: effLineHeight,
        fontFamily: baseFont
      },
      sidebar: {
        width: '32%',
        backgroundColor: '#f8fafc',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        padding: effPaddingPt,
        paddingRight: isOnePage ? 8 : 10
      },
      main: {
        width: '68%',
        padding: effPaddingPt,
        paddingLeft: isOnePage ? 10 : 14
      },
      sideSectionTitle: {
        fontSize: effFontSize + 0.2,
        fontFamily: boldFont,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: accentColor,
        borderBottomWidth: 1,
        borderBottomColor: accentColor,
        paddingBottom: spacing.sectionTitlePaddingBottom,
        marginBottom: spacing.sectionTitleMarginBottom,
        marginTop: spacing.sectionMarginTop + 1
      },
      sideLabel: {
        fontSize: effFontSize - 2,
        fontFamily: boldFont,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: isOnePage ? 2.5 : 4
      },
      sideValue: {
        fontSize: effFontSize - 0.8,
        color: '#334155',
        marginTop: 1,
        textDecoration: 'none'
      },
      mainName: {
        fontSize: effFontSize + (isOnePage ? 9 : 11),
        fontFamily: boldFont,
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2
      },
      mainSectionTitle: {
        fontSize: effFontSize + 0.6,
        fontFamily: boldFont,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: accentColor,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingBottom: spacing.sectionTitlePaddingBottom,
        marginTop: spacing.sectionMarginTop + 1,
        marginBottom: spacing.sectionTitleMarginBottom
      },
      entryContainer: {
        marginBottom: spacing.entryMarginBottom
      },
      entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      },
      entryTitle: {
        fontSize: effFontSize,
        fontFamily: boldFont,
        color: '#0f172a'
      },
      entrySubtitle: {
        fontSize: effFontSize - 0.5,
        color: '#475569',
        fontFamily: italicFont
      },
      entryDates: {
        fontSize: effFontSize - 1.5,
        color: '#64748b'
      },
      bulletRow: {
        flexDirection: 'row',
        marginTop: spacing.bulletMarginTop,
        paddingLeft: spacing.bulletPaddingLeft
      },
      bulletDot: {
        width: isOnePage ? 6 : 8,
        fontSize: effFontSize,
        color: '#475569'
      },
      bulletText: {
        flex: 1,
        fontSize: effFontSize - 0.5,
        color: '#334155',
        lineHeight: effLineHeight
      },
      paragraphText: {
        fontSize: effFontSize - 0.5,
        color: '#334155',
        lineHeight: effLineHeight,
        textAlign: 'justify',
        marginTop: isOnePage ? 1 : 2
      }
    })

    return (
      <Page size="A4" style={s.page}>
        {/* LEFT SIDEBAR (32%) */}
        <View style={s.sidebar}>
          <Text style={[s.sideSectionTitle, { marginTop: 0 }]}>Contact</Text>
          {email ? (
            <View>
              <Text style={s.sideLabel}>Email</Text>
              <Link src={`mailto:${email}`} style={s.sideValue}><Text>{email}</Text></Link>
            </View>
          ) : null}
          {phone ? (
            <View>
              <Text style={s.sideLabel}>Phone</Text>
              <Text style={s.sideValue}>{phone}</Text>
            </View>
          ) : null}
          {cleanLinkedin ? (
            <View>
              <Text style={s.sideLabel}>LinkedIn</Text>
              <Link src={`https://${cleanLinkedin}`} style={s.sideValue}><Text>{cleanLinkedin}</Text></Link>
            </View>
          ) : null}
          {github ? (
            <View>
              <Text style={s.sideLabel}>GitHub</Text>
              <Link src={`https://${github}`} style={s.sideValue}><Text>{github}</Text></Link>
            </View>
          ) : null}
          {portfolio ? (
            <View>
              <Text style={s.sideLabel}>Portfolio</Text>
              <Link src={`https://${portfolio}`} style={s.sideValue}><Text>{portfolio}</Text></Link>
            </View>
          ) : null}

          {(degree || department) ? (
            <View>
              <Text style={s.sideSectionTitle}>Education</Text>
              <Text style={[s.sideValue, { fontFamily: boldFont, color: '#0f172a' }]}>{degree}</Text>
              {department ? <Text style={s.sideValue}>{department}</Text> : null}
              {year ? <Text style={[s.sideValue, { color: '#64748b' }]}>Class of {year}</Text> : null}
              {gpa ? <Text style={[s.sideValue, { color: '#64748b' }]}>GPA: {gpa}</Text> : null}
            </View>
          ) : null}

          {hasSkills ? (
            <View>
              <Text style={s.sideSectionTitle}>Skills</Text>
              {skills.languages ? (
                <View>
                  <Text style={s.sideLabel}>Languages</Text>
                  <Text style={s.sideValue}>{skills.languages}</Text>
                </View>
              ) : null}
              {skills.frameworks ? (
                <View>
                  <Text style={s.sideLabel}>Frameworks</Text>
                  <Text style={s.sideValue}>{skills.frameworks}</Text>
                </View>
              ) : null}
              {skills.tools ? (
                <View>
                  <Text style={s.sideLabel}>Tools</Text>
                  <Text style={s.sideValue}>{skills.tools}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {recognitions.length > 0 ? (
            <View>
              <Text style={s.sideSectionTitle}>Awards</Text>
              {recognitions.map((rec, ri) => (
                <View key={ri} style={{ marginTop: 3 }}>
                  <Text style={[s.sideValue, { fontFamily: boldFont }]}>{rec.award}</Text>
                  <Text style={[s.sideValue, { fontSize: baseFontSize - 1.5, color: '#64748b' }]}>{[rec.issuer, rec.date].filter(Boolean).join(' · ')}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* RIGHT MAIN (68%) */}
        <View style={s.main}>
          <Text style={s.mainName}>{fullName}</Text>
          {degree ? (
            <Text style={{ fontSize: baseFontSize - 0.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              {degree} {department ? `· ${department}` : ''}
            </Text>
          ) : null}

          {careerObjective ? (
            <View>
              <Text style={[s.mainSectionTitle, { marginTop: 4 }]}>Profile Summary</Text>
              <Text style={s.paragraphText}>
                {formatParagraph(careerObjective)}
              </Text>
            </View>
          ) : null}

          {workHistories.length > 0 ? (
            <View>
              <Text style={s.mainSectionTitle}>Experience</Text>
              {workHistories.map((work, wi) => {
                const bullets = parseBullets(work.final_edited_text || work.original_description || '')
                const dateRange = [work.start_date, work.end_date || 'Present'].filter(Boolean).join(' – ')
                return (
                  <View key={wi} style={s.entryContainer}>
                    <View style={s.entryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={s.entryTitle}>{work.role || 'Role'}</Text>
                        {work.company ? <Text style={s.entrySubtitle}>— {work.company}</Text> : null}
                      </View>
                      {dateRange ? <Text style={s.entryDates}>{dateRange}</Text> : null}
                    </View>
                    {work.tech ? (
                      <Text style={{ fontSize: baseFontSize - 1.5, color: '#64748b', fontFamily: italicFont, marginBottom: 1 }}>
                        Technologies: {work.tech}
                      </Text>
                    ) : null}
                    {bullets.map((b, bi) => (
                      <View key={bi} style={s.bulletRow}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View>
              <Text style={s.mainSectionTitle}>Projects</Text>
              {projects.map((proj, pi) => {
                const bullets = parseBullets(proj.final_edited_text || proj.original_description || '')
                return (
                  <View key={pi} style={s.entryContainer}>
                    <View style={s.entryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={s.entryTitle}>{proj.title || 'Project'}</Text>
                        {proj.tech ? <Text style={s.entrySubtitle}>({proj.tech})</Text> : null}
                      </View>
                    </View>
                    {bullets.map((b, bi) => (
                      <View key={bi} style={s.bulletRow}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          ) : null}

          {activities.length > 0 ? (
            <View>
              <Text style={s.mainSectionTitle}>Leadership & Activities</Text>
              {activities.map((act, ai) => (
                <View key={ai} style={s.entryContainer}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{act.role} · {act.org}</Text>
                    <Text style={s.entryDates}>{[act.start_date, act.end_date].filter(Boolean).join(' – ')}</Text>
                  </View>
                  {act.description ? <Text style={{ fontSize: baseFontSize - 0.5, color: '#475569' }}>{act.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    )
  }

  // ==========================================
  // TEMPLATE 3: EXECUTIVE (MINIMALIST REFINED)
  // ==========================================
  const renderExecutive = () => {
    const s = StyleSheet.create({
      page: {
        padding: effPaddingPt,
        backgroundColor: '#ffffff',
        color: '#18181b',
        fontSize: effFontSize,
        lineHeight: effLineHeight,
        fontFamily: baseFont
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#d4d4d8',
        paddingBottom: isOnePage ? 5 : 8,
        marginBottom: spacing.headerMarginBottom
      },
      name: {
        fontSize: effFontSize + (isOnePage ? 9 : 12),
        fontFamily: boldFont,
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: 0.5
      },
      subTitle: {
        fontSize: effFontSize - 1,
        fontFamily: boldFont,
        color: '#71717a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2
      },
      contactBox: {
        textAlign: 'right',
        fontSize: effFontSize - 1.5,
        color: '#52525b'
      },
      sectionTitle: {
        fontSize: effFontSize + 0.2,
        fontFamily: boldFont,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: '#71717a',
        marginBottom: spacing.sectionTitleMarginBottom,
        marginTop: spacing.sectionMarginTop
      },
      entryContainer: {
        marginBottom: spacing.entryMarginBottom
      },
      entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      },
      entryTitle: {
        fontSize: effFontSize,
        fontFamily: boldFont,
        color: '#18181b'
      },
      entryCompany: {
        fontSize: effFontSize - 0.5,
        color: '#52525b'
      },
      entryDates: {
        fontSize: effFontSize - 1.5,
        color: '#71717a'
      },
      bulletRow: {
        flexDirection: 'row',
        marginTop: spacing.bulletMarginTop,
        paddingLeft: spacing.bulletPaddingLeft
      },
      bulletDot: {
        width: isOnePage ? 7 : 10,
        fontSize: effFontSize,
        color: '#71717a'
      },
      bulletText: {
        flex: 1,
        fontSize: effFontSize - 0.5,
        color: '#27272a',
        lineHeight: effLineHeight
      },
      paragraphText: {
        fontSize: effFontSize - 0.5,
        color: '#27272a',
        lineHeight: effLineHeight,
        textAlign: 'justify',
        marginTop: isOnePage ? 1 : 2
      },
      skillRow: {
        flexDirection: 'row',
        marginTop: spacing.skillRowMarginTop
      },
      skillLabel: {
        fontFamily: boldFont,
        fontSize: effFontSize - 0.5,
        color: '#18181b',
        width: isOnePage ? 120 : 140
      },
      skillValue: {
        flex: 1,
        fontSize: effFontSize - 0.5,
        color: '#3f3f46'
      }
    })

    return (
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.name}>{fullName}</Text>
            {degree ? <Text style={s.subTitle}>{degree} {department ? `· ${department}` : ''}</Text> : null}
          </View>
          <View style={s.contactBox}>
            {email ? <Text>{email}</Text> : null}
            {phone ? <Text>{phone}</Text> : null}
            {cleanLinkedin ? <Text>{cleanLinkedin}</Text> : null}
            {github ? <Text>{github}</Text> : null}
          </View>
        </View>

        {careerObjective ? (
          <View>
            <Text style={s.sectionTitle}>Executive Summary</Text>
            <Text style={s.paragraphText}>
              {formatParagraph(careerObjective)}
            </Text>
          </View>
        ) : null}

        {workHistories.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Professional Experience</Text>
            {workHistories.map((work, wi) => {
              const bullets = parseBullets(work.final_edited_text || work.original_description || '')
              const dateRange = [work.start_date, work.end_date || 'Present'].filter(Boolean).join(' – ')
              return (
                <View key={wi} style={s.entryContainer}>
                  <View style={s.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={s.entryTitle}>{work.role}</Text>
                      {work.company ? <Text style={s.entryCompany}>— {work.company}</Text> : null}
                    </View>
                    {dateRange ? <Text style={s.entryDates}>{dateRange}</Text> : null}
                  </View>
                  {work.tech ? (
                    <Text style={{ fontSize: baseFontSize - 1.5, color: '#71717a', fontStyle: 'italic', marginBottom: 1 }}>
                      Technologies: {work.tech}
                    </Text>
                  ) : null}
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Key Projects</Text>
            {projects.map((proj, pi) => {
              const bullets = parseBullets(proj.final_edited_text || proj.original_description || '')
              return (
                <View key={pi} style={s.entryContainer}>
                  <View style={s.entryHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={s.entryTitle}>{proj.title}</Text>
                      {proj.tech ? <Text style={s.entryCompany}>({proj.tech})</Text> : null}
                    </View>
                  </View>
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {hasSkills ? (
          <View>
            <Text style={s.sectionTitle}>Technical Proficiency</Text>
            {skills.languages ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Languages:</Text>
                <Text style={s.skillValue}>{skills.languages}</Text>
              </View>
            ) : null}
            {skills.frameworks ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Frameworks:</Text>
                <Text style={s.skillValue}>{skills.frameworks}</Text>
              </View>
            ) : null}
            {skills.tools ? (
              <View style={s.skillRow}>
                <Text style={s.skillLabel}>Tools & Cloud:</Text>
                <Text style={s.skillValue}>{skills.tools}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {(degree || department) ? (
          <View>
            <Text style={s.sectionTitle}>Education</Text>
            <View style={s.entryContainer}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{degree}{department ? ` in ${department}` : ''}</Text>
                <Text style={s.entryDates}>{[year ? `Class of ${year}` : '', gpa ? `GPA: ${gpa}` : ''].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </Page>
    )
  }

  return (
    <Document title={`${fullName} - Resume`}>
      {template === 'modern' ? renderModern() : template === 'executive' ? renderExecutive() : renderClassic()}
    </Document>
  )
}
