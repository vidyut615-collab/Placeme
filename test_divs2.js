const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');

const modalBodyStart = content.indexOf('{/* 2-Side Comparison View: Left (Earlier) vs Right (Changed) */}');
const rightColStart = content.indexOf('{/* RIGHT COLUMN: What They Changed (Proposed Changes) */}');
const modalFooterStart = content.indexOf('{/* Modal Footer with Direct Actions */}');

const leftText = content.substring(modalBodyStart, rightColStart);
const rightText = content.substring(rightColStart, modalFooterStart);

console.log('LEFT COLUMN:');
console.log('divOpens:', (leftText.match(/<div/g) || []).length);
console.log('divCloses:', (leftText.match(/<\/div>/g) || []).length);

console.log('RIGHT COLUMN:');
console.log('divOpens:', (rightText.match(/<div/g) || []).length);
console.log('divCloses:', (rightText.match(/<\/div>/g) || []).length);
