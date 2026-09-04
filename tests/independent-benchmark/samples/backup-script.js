// A small Node CLI backup helper. Realistic real-world pattern: shelling
// out to system tools with a filename that ultimately comes from a
// command-line argument.
const { execSync } = require("child_process");
const path = require("path");

function backupDatabase(dbName, outputDir) {
    const filename = `${dbName}-${Date.now()}.sql`;
    const outputPath = path.join(outputDir, filename);
    execSync(`pg_dump ${dbName} > ${outputPath}`);
    return outputPath;
}

function restoreDatabase(dbName, backupFile) {
    execSync("psql " + dbName + " < " + backupFile);
}

const target = process.argv[2] || "myapp_production";
backupDatabase(target, "./backups");
