const fs = require('fs');

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const extractors = 
            // Links compare helper
            const oldLinks = oldData.links || {}
            const newLinks = newData.links || {}
            const linksDiff = JSON.stringify(oldLinks) !== JSON.stringify(newLinks)

            // Education helper
            const oldEdu = Array.isArray(oldData.education) ? oldData.education : []
            const newEdu = Array.isArray(newData.education) ? newData.education : []
            const eduDiff = JSON.stringify(oldEdu) !== JSON.stringify(newEdu)

            // Experience helper
            const oldExp = Array.isArray(oldData.experience) ? oldData.experience : []
            const newExp = Array.isArray(newData.experience) ? newData.experience : []
            const expDiff = JSON.stringify(oldExp) !== JSON.stringify(newExp)

            // Projects helper
            const oldProj = Array.isArray(oldData.projects) ? oldData.projects : []
            const newProj = Array.isArray(newData.projects) ? newData.projects : []
            const projDiff = JSON.stringify(oldProj) !== JSON.stringify(newProj)
;
    content = content.replace(
        /\/\/ Links compare helper\s+const oldLinks = oldData\.links \|\| \{\}\s+const newLinks = newData\.links \|\| \{\}\s+const linksDiff = JSON\.stringify\(oldLinks\) !== JSON\.stringify\(newLinks\)/,
        extractors.trim()
    );

    const leftBlockRegex = /(\{\/\* 4\. Links \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>)/s;
    const matchLeft = content.match(leftBlockRegex);
    if (!matchLeft) {
        console.error('Could not find Left Block 4. Links in ' + filePath);
        return;
    }
    const leftLinksBlock = matchLeft[0];

    const leftAdditional = 
                      {/* 5. Education */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          Detailed Education
                        </div>
                        <div className="space-y-2">
                          {oldEdu.length === 0 ? <p className="text-xs text-zinc-500 italic">No education added.</p> : oldEdu.map((edu: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900 space-y-1 text-xs">
                              <div className="font-semibold">{edu.level} • {edu.institution}</div>
                              <div className="text-[11px] text-zinc-500">{edu.board} • {edu.passing_year} • {edu.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 6. Experience */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                          Experience
                        </div>
                        <div className="space-y-2">
                          {oldExp.length === 0 ? <p className="text-xs text-zinc-500 italic">No experience added.</p> : oldExp.map((exp: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900 space-y-1 text-xs">
                              <div className="font-semibold">{exp.role} @ {exp.company}</div>
                              <div className="text-[11px] text-zinc-500">{exp.start_date} - {exp.end_date}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 7. Projects */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          Projects
                        </div>
                        <div className="space-y-2">
                          {oldProj.length === 0 ? <p className="text-xs text-zinc-500 italic">No projects added.</p> : oldProj.map((proj: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg border bg-white dark:bg-zinc-900 space-y-1 text-xs">
                              <div className="font-semibold">{proj.title}</div>
                              <div className="text-[11px] text-zinc-500 truncate">{proj.tech}</div>
                            </div>
                          ))}
                        </div>
                      </div>
;
    content = content.replace(leftLinksBlock, leftLinksBlock + '\n' + leftAdditional);

    const rightSideMatch = content.match(/\{\/\* 4\. Links \*\/\}.*?Portfolio & Profile Links.*?<\/div>\s*<\/div>\s*<\/div>/sg);
    
    if (rightSideMatch && rightSideMatch.length === 2) {
        const rightLinksBlock = rightSideMatch[1];
        
        const rightAdditional = 
                      {/* 5. Education */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                            Detailed Education
                          </div>
                          {eduDiff && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div className={\space-y-2 \\}>
                          {newEdu.length === 0 ? <p className="text-xs text-zinc-500 italic p-1">No education added.</p> : newEdu.map((edu: any, i: number) => (
                            <div key={i} className={\p-2.5 rounded-lg border space-y-1 text-xs \\}>
                              <div className="font-bold">{edu.level} • {edu.institution}</div>
                              <div className="text-[11px] text-zinc-500">{edu.board} • {edu.passing_year} • {edu.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 6. Experience */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                            Experience
                          </div>
                          {expDiff && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div className={\space-y-2 \\}>
                          {newExp.length === 0 ? <p className="text-xs text-zinc-500 italic p-1">No experience added.</p> : newExp.map((exp: any, i: number) => (
                            <div key={i} className={\p-2.5 rounded-lg border space-y-1 text-xs \\}>
                              <div className="font-bold">{exp.role} @ {exp.company}</div>
                              <div className="text-[11px] text-zinc-500">{exp.start_date} - {exp.end_date}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 7. Projects */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            Projects
                          </div>
                          {projDiff && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div className={\space-y-2 \\}>
                          {newProj.length === 0 ? <p className="text-xs text-zinc-500 italic p-1">No projects added.</p> : newProj.map((proj: any, i: number) => (
                            <div key={i} className={\p-2.5 rounded-lg border space-y-1 text-xs \\}>
                              <div className="font-bold">{proj.title}</div>
                              <div className="text-[11px] text-zinc-500 truncate">{proj.tech}</div>
                            </div>
                          ))}
                        </div>
                      </div>
;
        content = content.replace(rightLinksBlock, rightLinksBlock + '\n' + rightAdditional);
    } else {
        console.error('Could not precisely find Right Block 4. Links in ' + filePath);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched ' + filePath);
}

patchFile('src/app/(dashboards)/college/approvals/ApprovalsList.tsx');
patchFile('src/components/ApprovalLogTable.tsx');
