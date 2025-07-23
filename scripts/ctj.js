const fs = require("fs").promises;
const path = require("path");

// Files and folders to skip
const skipItems = new Set([
  "node_modules",
  "dist",
  "build",
  "original_code",
  ".git",
  ".DS_Store",
  "package-lock.json",
  "yarn.lock",
  "codebase.json", // Prevent including the output file
  "scripts",
  "assets",
]);

async function readCodebase(dir, baseDir = dir) {
  const result = {};
  try {
    // Check if the input path exists and is accessible
    await fs.access(dir);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

      // Skip specified files and folders
      if (skipItems.has(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        const subDirContents = await readCodebase(fullPath, baseDir);
        Object.assign(result, subDirContents);
      } else if (entry.isFile()) {
        try {
          const content = await fs.readFile(fullPath, "utf8");
          result[relativePath] = content;
        } catch (error) {
          console.warn(
            `Warning: Could not read file ${relativePath}: ${error.message}`
          );
          result[relativePath] = ""; // Store empty string for unreadable files
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`Error accessing directory ${dir}: ${error.message}`);
    return result;
  }
}

async function saveCodebaseToJson(rootDir, outputFile) {
  try {
    // Resolve paths to absolute paths
    const absoluteRootDir = path.resolve(rootDir);
    const absoluteOutputFile = path.resolve(outputFile);

    const codebase = await readCodebase(absoluteRootDir);

    // Check if any files were found
    if (Object.keys(codebase).length === 0) {
      console.warn("No files were found in the specified directory");
    }

    await fs.writeFile(absoluteOutputFile, JSON.stringify(codebase, null, 2));
    console.log(`Codebase saved to ${absoluteOutputFile}`);
    console.log(`Total files processed: ${Object.keys(codebase).length}`);
  } catch (error) {
    console.error(`Error saving codebase to JSON: ${error.message}`);
    throw error; // Re-throw to allow calling code to handle errors
  }
}

// Example usage: node readCodebase.js ./src codebase.json
async function main() {
  const [, , rootDir = "./", outputFile = "codebase.json"] = process.argv;

  // Validate input arguments
  if (!rootDir || !outputFile) {
    console.error("Usage: node readCodebase.js <rootDir> <outputFile>");
    process.exit(1);
  }

  try {
    await saveCodebaseToJson(rootDir, outputFile);
  } catch (error) {
    process.exit(1);
  }
}

main();
