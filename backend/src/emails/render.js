const fs = require('fs');
const path = require('path');

function renderTemplate(templateName, variables = {}) {
  const filePath = path.join(__dirname, 'templates', templateName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

module.exports = { renderTemplate };
