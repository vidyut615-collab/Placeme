export const PROMPT_SHORTEN_JD = `Rewrite the Job Description concisely in under 250 words. Focus strictly on responsibilities, hard/soft skills, tools, and required knowledge. Ensure it emphasizes teamwork, problem-solving, strategic thinking, and independence if mentioned in the original.
Provide ONLY the rewritten text, with no introductory or supporting text.

[Job Description]
{{JOB_DESCRIPTION}}`;

export const PROMPT_WORK_HISTORY = `Generate 3 distinct, ATS-friendly suggestions for a resume work history entry. 
Format: Output valid JSON exactly like this: {"options": ["option 1...", "option 2...", "option 3..."]}

Guidelines:
- FORMAT AS BULLET POINTS: Each option string MUST be a bulleted list (use the - character and \n newlines). Do not write a continuous paragraph.
- Focus on specific achievements, quantifiable metrics, and hard skills.
- Use a formal, concise tone with active voice and strong action verbs.
- Avoid contractions, colloquial language, or general fluff.
- Tailor the summary directly to the Target Job Description.
- Ensure perfect grammar and spelling.

[Past Job]
Title: {{JOB_TITLE}}
Company: {{COMPANY_NAME}}
Tech Used: {{TECHNOLOGY_USED}}

[Target Job Description]
{{SHORTENED_JD}}`;

export const PROMPT_PROJECT = `Generate 3 distinct, ATS-friendly suggestions for a resume project entry.
Format: Output valid JSON exactly like this: {"options": ["option 1...", "option 2...", "option 3..."]}

Guidelines:
- FORMAT AS BULLET POINTS: Each option string MUST be a bulleted list (use the - character and \n newlines). Do not write a continuous paragraph.
- Emphasize project details, tech stack, and quantifiable results.
- Use a formal, concise tone with active voice and strong action verbs.
- Avoid contractions, colloquial language, or general fluff.
- Tailor the summary directly to the Target Job Description.
- Ensure perfect grammar and spelling.

[Project Details]
Title: {{PROJECT_TITLE}}
Tech Used: {{TECHNOLOGY_USED}}
Description: {{PROJECT_DESCRIPTION}}

[Target Job Description]
{{SHORTENED_JD}}`;

export const PROMPT_CAREER_OBJECTIVE = `Generate 3 distinct, ATS-friendly Career Objective suggestions tailored to the target job.
Format: Output valid JSON exactly like this: {"options": ["option 1...", "option 2...", "option 3..."]}

Guidelines:
- FORMAT AS BULLET POINTS: Each option string MUST be a bulleted list (use the - character and \n newlines). Do not write a continuous paragraph.
- Word count: 50-70 words per option.
- Opening: Start with a strong action adjective and state the candidate's title with total years of experience (calculated from their work histories).
- Experience & Skills: Highlight key skills aligned with the job description using powerful vocabulary (max 18 words).
- Objective: Clearly state the desire to contribute to {{COMPANY_NAME}}.
- Impact: Include up to 2 key quantified achievements from their past to demonstrate impact.
- Tone: Professional, humanized, concise. Avoid overused buzzwords.

[Candidate Data]
Work Histories: 
{{WORK_HISTORIES}}
Core Skills: {{DOMAIN_SKILLS}}
Tools: {{TOOLS_SKILLS}}
Soft Skills: {{SOFT_SKILLS}}

[Target Role]
Role: {{JOB_ROLE}}
Company: {{COMPANY_NAME}}

[Target Job Description]
{{SHORTENED_JD}}`;
