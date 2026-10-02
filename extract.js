const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');
const modalBodyStart = content.indexOf('{/* LEFT COLUMN: Earlier (Current Live Profile) */}');
const rightColStart = content.indexOf('{/* RIGHT COLUMN: What They Changed (Proposed Changes) */}');
fs.writeFileSync('left_col.txt', content.substring(modalBodyStart, rightColStart));
