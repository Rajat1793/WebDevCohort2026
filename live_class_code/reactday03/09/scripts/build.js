import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { teas } from '../src/data.js';
import App from '../src/App.js';

// GET __dirname
const __filename = fileURLToPath(import.meta.url);  //build.sh ki location se __filename milega, uske baad uska dirname milega
const __dirname = path.dirname(__filename);

// Define output path
const outputPath = path.join(__dirname, '../dist'); // __dirname se ek step upar jao, phir dist folder ke andar jao
const htmlTemplatePath = path.join(__dirname, '../src/template.html'); // template.html ki location se htmlTemplatePath milega
const outputHtmlPath = path.join(outputPath, 'index.html'); // outputPath ke andar index.html create hoga

const template = fs.readFileSync(htmlTemplatePath, 'utf-8'); // template.html ko read karo

const appHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(App, {teas}));

const finalHtml = template.replace('<!-- APP -->', appHtml); // template.html me <!-- APP --> ko appHtml se replace karo

// Write the final HTML to the output path
fs.ensureDirSync(outputPath); // outputPath ko ensure karo, agar nahi hai to create karo
fs.writeFileSync(outputHtmlPath, finalHtml, 'utf-8'); // finalHtml ko outputHtmlPath me write karo

console.log("build Complete.. output generated at: ", outputHtmlPath);