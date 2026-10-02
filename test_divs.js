const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');

const modalBodyStart = content.indexOf('{/* 2-Side Comparison View: Left (Earlier) vs Right (Changed) */}');
const modalFooterStart = content.indexOf('{/* Modal Footer with Direct Actions */}');

const bodyText = content.substring(modalBodyStart, modalFooterStart);

const divOpens = (bodyText.match(/<div/g) || []).length;
const divCloses = (bodyText.match(/<\/div>/g) || []).length;

console.log('divOpens:', divOpens);
console.log('divCloses:', divCloses);
console.log('Difference:', divOpens - divCloses);
