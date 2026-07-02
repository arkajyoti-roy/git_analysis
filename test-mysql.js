const sql = `
-- MySQL dump 10.13
DROP TABLE IF EXISTS \`users\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`users\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`users_email_unique\` (\`email\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`posts\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` bigint unsigned NOT NULL,
  \`title\` varchar(255) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`posts_user_id_foreign\` (\`user_id\`),
  CONSTRAINT \`posts_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

function parseSqlToMermaid(sql) {
    let mermaid = 'erDiagram\n';
    let cleanSql = sql.replace(/IF NOT EXISTS/gi, '').replace(/[`'"]/g, '');
    const chunks = cleanSql.split(/CREATE\s+TABLE/i);
    let hasTables = false;
    const relationships = [];

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const tableNameMatch = chunk.match(/^([a-zA-Z0-9_]+)/);
      if (!tableNameMatch) continue;
      const tableName = tableNameMatch[1];
      
      const openIdx = chunk.indexOf('(');
      const closeIdx = chunk.lastIndexOf(')');
      if (openIdx === -1 || closeIdx === -1 || closeIdx < openIdx) continue;
      
      let body = chunk.substring(openIdx + 1, closeIdx);
      hasTables = true;
      
      body = body.replace(/\([^)]+\)/g, (m) => m.replace(/,/g, ' '));
      const lines = body.split(',').map(l => l.trim()).filter(l => l);
      mermaid += `  ${tableName} {\n`;
      
      lines.forEach(line => {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/i);
        if (fkMatch) {
          relationships.push(`${tableName} }o--|| ${fkMatch[1]} : "references"`);
          return;
        }

        if (line.match(/^(PRIMARY\s+KEY|UNIQUE|KEY|CONSTRAINT|FULLTEXT)/i)) {
          return;
        }

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let colName = parts[0].replace(/[^a-zA-Z0-9_]/g, '');
          let colType = parts[1].replace(/[^a-zA-Z0-9_]/g, ''); 
          
          if (!colName || !colType) return;

          const inlineFk = line.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);
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

    if (!hasTables) return '';
    relationships.forEach(rel => { mermaid += `  ${rel}\n`; });
    return mermaid;
}

console.log(parseSqlToMermaid(sql));
