const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');

const modalBodyStart = content.indexOf('{/* 2-Side Comparison View: Left (Earlier) vs Right (Changed) */}');
const modalFooterStart = content.indexOf('{/* Modal Footer with Direct Actions */}');

const text = content.substring(modalBodyStart, modalFooterStart);

const badgeOpens = (text.match(/<Badge/g) || []).length;
const badgeCloses = (text.match(/<\/Badge>/g) || []).length;
const badgeSelfCloses = (text.match(/<Badge[^>]*\/>/g) || []).length;

console.log('Badge opens:', badgeOpens);
console.log('Badge closes:', badgeCloses);
console.log('Badge self closes:', badgeSelfCloses);
