const fs = require('fs');
const leftText = fs.readFileSync('left_col.txt', 'utf8');

let indent = 0;
const lines = leftText.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    
    if (opens > closes) {
        indent += (opens - closes);
        console.log(+ () [Line ]: );
    } else if (closes > opens) {
        indent -= (closes - opens);
        console.log(- () [Line ]: );
    } else if (opens > 0) {
        console.log(=0 () [Line ]: );
    }
}
