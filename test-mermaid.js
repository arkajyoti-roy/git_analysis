const sql = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP
);
CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  body TEXT
);`;

function parseSqlToMermaid(sql) {
    let mermaid = 'erDiagram\n';
    
    let cleanSql = sql.replace(/IF NOT EXISTS/gi, '').replace(/`/g, '');
    
    const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\)(?=\s*CREATE\s+TABLE|$|;)/gi;
    let match;
    let hasTables = false;
    const relationships = [];

    while ((match = tableRegex.exec(cleanSql)) !== null) {
      hasTables = true;
      const tableName = match[1];
      let body = match[2];
      
      body = body.replace(/\([^)]+\)/g, (m) => m.replace(/,/g, ' '));
      
      const lines = body.split(',').map(l => l.trim()).filter(l => l);
      mermaid += `  ${tableName} {\n`;
      
      lines.forEach(line => {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)/i);
        if (fkMatch) {
          relationships.push(`${tableName} }o--|| ${fkMatch[2]} : "references"`);
          return;
        }

        if (line.match(/^(PRIMARY\s+KEY|UNIQUE|KEY|CONSTRAINT)/i)) {
          return;
        }

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let colName = parts[0];
          let colType = parts[1];
          colType = colType.replace(/[^a-zA-Z0-9_]/g, ''); 
          if (!colType) colType = 'type';

          const inlineFk = line.match(/REFERENCES\s+(\w+)/i);
          if (inlineFk) {
            relationships.push(`${tableName} }o--|| ${inlineFk[1]} : "references"`);
          }

          let keyMarker = '';
          if (line.match(/PRIMARY\s+KEY/i)) keyMarker = 'PK';
          else if (inlineFk) keyMarker = 'FK';

          mermaid += `    ${colType} ${colName} ${keyMarker}\n`;
        }
      });
      mermaid += `  }\n`;
    }

    if (!hasTables) {
      return '';
    }

    relationships.forEach(rel => {
      mermaid += `  ${rel}\n`;
    });
    
    return mermaid;
}

console.log(parseSqlToMermaid(sql));
