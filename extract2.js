const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');
const rightColStart = content.indexOf('{/* RIGHT COLUMN: What They Changed (Proposed Changes) */}');
const footerStart = content.indexOf('{/* Modal Footer with Direct Actions */}');
fs.writeFileSync('right_col.txt', content.substring(rightColStart, footerStart));
