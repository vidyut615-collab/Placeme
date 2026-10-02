const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboards)/college/approvals/ApprovalsList.tsx', 'utf8');

const modalBodyStart = content.indexOf('{/* 2-Side Comparison View: Left (Earlier) vs Right (Changed) */}');
const modalFooterStart = content.indexOf('{/* Modal Footer with Direct Actions */}');

const text = content.substring(modalBodyStart, modalFooterStart);

let indent = 0;
const lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const allOpens = (line.match(/<div/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
    const actualOpens = allOpens - selfCloses;
    const closes = (line.match(/<\/div>/g) || []).length;
    
    if (actualOpens > closes) {
        indent += (actualOpens - closes);
        console.log('+' + (actualOpens-closes) + ' (' + indent + ') [Line ' + (i+1) + ']: ' + line.trim().substring(0, 50));
    } else if (closes > actualOpens) {
        indent -= (closes - actualOpens);
        console.log('-' + (closes-actualOpens) + ' (' + indent + ') [Line ' + (i+1) + ']: ' + line.trim().substring(0, 50));
    }
}
console.log('FINAL INDENT:', indent);
