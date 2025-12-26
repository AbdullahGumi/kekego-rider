const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const appJsonPath = path.join(__dirname, '../app.json');

// 1. Update package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.');

if (versionParts.length === 3) {
    versionParts[2] = parseInt(versionParts[2], 10) + 1;
    const newVersion = versionParts.join('.');

    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json version from ${currentVersion} to ${newVersion}`);

    // 2. Update app.json
    if (fs.existsSync(appJsonPath)) {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        if (appJson.expo) {
            appJson.expo.version = newVersion;
            fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
            console.log(`✅ Updated app.json version to ${newVersion}`);
        }
    }
} else {
    console.error('❌ Version format in package.json is not X.Y.Z');
    process.exit(1);
}
