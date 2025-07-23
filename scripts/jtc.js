// Running node jsonToCodebase.js codebase.json ./output

const fs = require("fs").promises;
const path = require("path");

async function jsonToCodebase(jsonFile, outputDir) {
  const errors = [];

  try {
    // Read and parse the JSON file
    const jsonContent = await fs.readFile(jsonFile, "utf8");
    const codebase = JSON.parse(jsonContent);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Process each file in the JSON
    for (const [relativePath, content] of Object.entries(codebase)) {
      try {
        // Skip non-string values or invalid entries
        if (typeof content !== "string") {
          errors.push(
            `Skipping ${relativePath}: Invalid content (not a string)`
          );
          continue;
        }

        // Create full path for the file
        const fullPath = path.join(outputDir, relativePath);

        // Create parent directories if they don't exist
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });

        // Write the file content
        await fs.writeFile(fullPath, content);
        console.log(`Created: ${relativePath}`);
      } catch (error) {
        errors.push(`Failed to create ${relativePath}: ${error.message}`);
      }
    }

    // Print error summary if any
    if (errors.length > 0) {
      console.log("\nError Summary:");
      errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    } else {
      console.log("\nAll files created successfully.");
    }
  } catch (error) {
    console.error(`Error processing JSON file: ${error.message}`);
  }
}

// Parse command-line arguments
const [, , jsonFile = "codebase.json", outputDir = "./output"] = process.argv;

// Main execution
(async () => {
  await jsonToCodebase(jsonFile, outputDir);
})();
