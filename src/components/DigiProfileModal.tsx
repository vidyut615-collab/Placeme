'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Download, Eye, FileText, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'

// Dynamic import for client-side only PDF generation
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

type DigiProfileModalProps = {
  profile: Record<string, any>
  email: string
  collegeName: string
  collegeLogoUrl?: string
}

export function DigiProfileModal({ profile, email, collegeName, collegeLogoUrl }: DigiProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMasked, setIsMasked] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handleDownload = async (masked: boolean) => {
    if (!printRef.current) return
    setIsGenerating(true)
    
    // Temporarily force the state if it doesn't match the requested download mode
    const originalMaskState = isMasked
    if (masked !== isMasked) {
      setIsMasked(masked)
      // Small timeout to allow React to re-render with the new masked state
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    try {
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8) // Use JPEG with 0.8 quality to keep size < 300KB
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`DigiProfile_${profile.first_name || 'Student'}${masked ? '_Masked' : ''}.pdf`)
    } catch (error) {
      console.error('Error generating PDF', error)
    } finally {
      setIsGenerating(false)
      // Restore original state if we changed it
      if (masked !== originalMaskState) {
        setIsMasked(originalMaskState)
      }
    }
  }

  // Masking helpers
  const maskEmail = (emailStr: string) => {
    if (!emailStr) return ''
    if (!isMasked) return emailStr
    const [name, domain] = emailStr.split('@')
    if (!domain) return '***'
    return `${name.substring(0, 2)}***@${domain}`
  }

  const maskPhone = (phoneStr: string) => {
    if (!phoneStr) return ''
    if (!isMasked) return phoneStr
    return '***-***-' + phoneStr.slice(-4)
  }
  
  const maskLink = (linkStr: string) => {
    if (!linkStr) return ''
    if (!isMasked) return linkStr
    return '[Hidden in Masked View]'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2 bg-zinc-100/80 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700" />}>
        <FileText className="h-4 w-4" />
        View DigiProfile
      </DialogTrigger>
      
      {/* 
        Use a max-w-4xl so it is large enough, and max-h-[90vh] with overflow-y-auto 
        so it scrolls if the profile is long.
      */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex flex-col p-0">
        
        {/* Header toolbar - sticky to top */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b shadow-sm">
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors">
            <Switch 
              id="masked-mode" 
              checked={isMasked} 
              onCheckedChange={setIsMasked} 
            />
            <Label htmlFor="masked-mode" className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-200">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Masked View</span>
            </Label>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button disabled={isGenerating} className="gap-2" />}>
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download'}
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload(false)}>
                Download Full PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload(true)}>
                Download Masked PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* The Printable Profile Template area */}
        <div className="p-8 flex justify-center w-full bg-zinc-100 dark:bg-zinc-950">
          <div 
            ref={printRef} 
            className="w-[210mm] min-h-[297mm] bg-white text-black p-8 shadow-sm border box-border"
            style={{ 
              // A4 styling 
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Template Header */}
            <div className="flex gap-6 mb-6">
              <div className="w-32 h-32 relative bg-gray-200 shrink-0 border">
                {profile.profile_picture ? (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profile_picture} alt="Profile" className="object-cover w-full h-full" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                    No Picture
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-2xl font-bold uppercase mb-2">{(profile.full_name || 'Student Name').toUpperCase()}</h1>
                
                <div className="grid grid-cols-[80px_1fr] gap-1 text-sm">
                  <div className="font-semibold">Course:</div>
                  <div>{profile.type || ''}, {profile.department || ''}, {profile.year || ''}</div>
                  
                  <div className="font-semibold">CGPA:</div>
                  <div>{profile.gpa || 'N/A'}</div>
                  
                  {!isMasked && (
                    <>
                      <div className="font-semibold">Email:</div>
                      <div>{email}</div>
                      
                      <div className="font-semibold">Mobile:</div>
                      <div>{profile.phone}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="w-32 h-32 flex items-center justify-center shrink-0">
                {collegeLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={collegeLogoUrl} alt={collegeName} className="object-contain w-24 h-24 rounded-full border-2 border-blue-800" crossOrigin="anonymous" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-blue-800 flex items-center justify-center text-blue-800 font-bold text-center text-xs p-2">
                    {collegeName}
                  </div>
                )}
              </div>
            </div>

            {/* Academic Details Section */}
            <div className="mb-4">
              <div className="bg-gray-200 p-1 border border-gray-800 font-bold text-sm uppercase mb-0">Academic Details</div>
              <table className="w-full border-collapse border border-gray-800 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border border-gray-800 p-1.5 w-1/6">COURSE</th>
                    <th className="border border-gray-800 p-1.5 w-2/6">SPECIALIZATION</th>
                    <th className="border border-gray-800 p-1.5 w-2/6">INSTITUTE/COLLEGE</th>
                    <th className="border border-gray-800 p-1.5 w-1/6">BOARD</th>
                    <th className="border border-gray-800 p-1.5 w-[10%]">SCORE</th>
                    <th className="border border-gray-800 p-1.5 w-[10%]">YEAR</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.education?.map((edu: any, i: number) => (
                    <tr key={i}>
                      <td className="border border-gray-800 p-1.5">{edu.level}</td>
                      <td className="border border-gray-800 p-1.5">{/* Spec not standard, leave blank or use dept if UG */}
                        {edu.level === 'UG (UnderGrad)' ? profile.department : ''}
                      </td>
                      <td className="border border-gray-800 p-1.5">{edu.institution}</td>
                      <td className="border border-gray-800 p-1.5">{edu.board}</td>
                      <td className="border border-gray-800 p-1.5">{edu.score}</td>
                      <td className="border border-gray-800 p-1.5">{edu.passing_year}</td>
                    </tr>
                  ))}
                  {(!profile.education || profile.education.length === 0) && (
                    <tr>
                      <td colSpan={6} className="border border-gray-800 p-2 text-center text-gray-500">No education details added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <table className="w-full border-collapse border border-gray-800 border-t-0 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-800 p-1.5 font-bold w-1/4 bg-gray-100">Technical Proficiency</td>
                    <td className="border border-gray-800 p-1.5 w-3/4">
                      {profile.skills?.languages ? `${profile.skills.languages}` : ''}
                      {profile.skills?.frameworks ? `, ${profile.skills.frameworks}` : ''}
                      {profile.skills?.tools ? `, ${profile.skills.tools}` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Projects Section */}
            <div className="mb-4">
              <div className="bg-gray-200 p-1 border border-gray-800 font-bold text-sm uppercase mb-0">Projects</div>
              <div className="border border-gray-800 border-t-0 p-3 text-sm space-y-4">
                {profile.projects?.map((proj: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between font-bold text-blue-900 mb-1">
                      <div>{proj.title}</div>
                      {/* Assuming tech acts as a secondary tag here */}
                      <div className="text-gray-600 font-normal text-xs">{proj.tech}</div>
                    </div>
                    {proj.link && (
                      <div className="text-xs text-blue-600 mb-1 break-all">
                        {isMasked ? maskLink(proj.link) : <a href={proj.link}>{proj.link}</a>}
                      </div>
                    )}
                    <p className="text-gray-800">{proj.description}</p>
                  </div>
                ))}
                {(!profile.projects || profile.projects.length === 0) && (
                  <p className="text-gray-500 text-center">No projects added.</p>
                )}
              </div>
            </div>

            {/* Experience Section */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="mb-4">
                <div className="bg-gray-200 p-1 border border-gray-800 font-bold text-sm uppercase mb-0">Work Experience</div>
                <div className="border border-gray-800 border-t-0 p-3 text-sm space-y-4">
                  {profile.experience.map((exp: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between font-bold mb-1">
                        <div>{exp.role} at {exp.company}</div>
                        <div className="text-gray-600 font-normal text-xs">{exp.start_date} - {exp.end_date}</div>
                      </div>
                      <p className="text-gray-800">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Important Links Section (Instead of certifications) */}
            {(profile.links?.linkedin || profile.links?.github || profile.links?.portfolio) && (
              <div className="mb-4">
                <div className="bg-gray-200 p-1 border border-gray-800 font-bold text-sm uppercase mb-0">Important Links</div>
                <table className="w-full border-collapse border border-gray-800 border-t-0 text-sm">
                  <tbody>
                    {profile.links.linkedin && (
                      <tr>
                        <td className="border border-gray-800 p-1.5 font-bold w-1/4">LinkedIn</td>
                        <td className={`border border-gray-800 p-1.5 w-3/4 break-all ${isMasked ? 'text-red-600' : 'text-blue-600'}`}>
                          {maskLink(profile.links.linkedin)}
                        </td>
                      </tr>
                    )}
                    {profile.links.github && (
                      <tr>
                        <td className="border border-gray-800 p-1.5 font-bold w-1/4">GitHub</td>
                        <td className="border border-gray-800 p-1.5 w-3/4 text-blue-600 break-all">{profile.links.github}</td>
                      </tr>
                    )}
                    {profile.links.portfolio && (
                      <tr>
                        <td className="border border-gray-800 p-1.5 font-bold w-1/4">Portfolio</td>
                        <td className="border border-gray-800 p-1.5 w-3/4 text-blue-600 break-all">{profile.links.portfolio}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
