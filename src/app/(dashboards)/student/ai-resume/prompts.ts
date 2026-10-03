export const PROMPT_SHORTEN_JD = `Rewrite Job Description in Structured and Concise manner, Under 250 Words. While Re-writing Focus more on Responsibilities, Skills, tools & Required Knowledge mentioned in Job description and curate and re-write job description based on that.  Make Sure you are keeping all the context with related to same.
"Include soft skills such as teamwork, problem-solving, and strategic thinking" or "Ensure the rewritten description includes all essential qualities, both hard and soft skills, mentioned in the original."
"Ensure the rewritten description emphasizes the candidate's ability to work independently and as part of a team, and their strategic thinking skills."
Provide only the rewritten job description in simple text format, without any supportive text.

Job Description as follows:
[
{{JOB_DESCRIPTION}}
]`;

export const PROMPT_WORK_HISTORY = `Generate 3 Suggestions for work history in json format. Focus on specific achievements and skills, instead of general statements, emphasize quantifiable results and specific skills. Use a more formal and concise tone: Avoid using contractions or colloquial language. Highlight key metrics and results, Quantify your achievements whenever possible. Use bullet points and Tailor your summary to the specific job you are applying for. Proofread carefully, ensure that there are no grammatical or spelling errors. Use active voice: Instead of passive voice, use active voice to make your summary more engaging. Use strong verbs, choose strong verbs that convey your accomplishments effectively. Use conversational language and show humane personality in your response. Avoid Writing any additional line.

Provide only the JSON array containing the 3 work history texts, without any additional explanation or formatting. Return an array of strings like: ["option 1 text...", "option 2 text...", "option 3 text..."]

[Past Job Details]
Past Job Title: {{JOB_TITLE}}
Past Company Name: {{COMPANY_NAME}}
Technology Used: {{TECHNOLOGY_USED}}

Applying Job Description
[
{{SHORTENED_JD}}
]`;

export const PROMPT_PROJECT = `Generate 3 Suggestions for project history in json format. Focus on project details mentioned, instead of general statements, emphasize quantifiable results and specific skills. Use a more formal and concise tone: Avoid using contractions or colloquial language. Highlight key metrics and results, Quantify your achievements whenever possible, if any. Use and Tailor your Project summary to the specific job you are applying for. Proofread carefully, ensure that there are no grammatical or spelling errors. Use active voice: Instead of passive voice, use active voice to make your summary more engaging. Use strong verbs, choose strong verbs that convey your accomplishments effectively. Use conversational language and show humane personality in your response. Avoid Writing any additional line.

Provide only the JSON array containing the 3 Project Summary texts, without any additional explanation or formatting. Return an array of strings like: ["option 1 text...", "option 2 text...", "option 3 text..."]

[Project Details]
Project Title: {{PROJECT_TITLE}}
Technology used: {{TECHNOLOGY_USED}}
Project Description: {{PROJECT_DESCRIPTION}}

Applying Job Description
[
{{SHORTENED_JD}}
]`;
