import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile, access, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import {
    createErrorResponse,
    debugLog,
} from "../../helpers.js";
import { CreateViteAppSchema } from "../schemas.js";
import { analyzeJsonStructure, type JsonStructureAnalysis, type FieldAnalysis } from "../import/json-analyzer.js";

// Helper function to generate schema fields from analysis (reusing existing logic)
function generateSchemaFields(analysis: JsonStructureAnalysis): Record<string, any> {
    const fields: Record<string, any> = {};

    for (const [fieldName, fieldAnalysis] of Object.entries(analysis.fields)) {
        // Skip nested object fields for now (they would need flattening)
        if (fieldName.includes(".")) {
            debugLog(`Skipping nested field: ${fieldName}`);
            continue;
        }

        const fieldConfig: any = {
            type: fieldAnalysis.searchcraft_type,
            stored: fieldAnalysis.suggested_config.stored,
        };

        // Add optional properties only if they differ from defaults
        if (fieldAnalysis.is_required) {
            fieldConfig.required = true;
        }

        if (!fieldAnalysis.suggested_config.indexed) {
            fieldConfig.indexed = false;
        }

        if (fieldAnalysis.suggested_config.fast) {
            fieldConfig.fast = true;
        }

        if (fieldAnalysis.suggested_config.multi) {
            fieldConfig.multi = true;
        }

        fields[fieldName] = fieldConfig;
    }

    return fields;
}

const execAsync = promisify(exec);

// Helper functions to reuse existing field detection logic
function findFieldByPatterns(fieldNames: string[], patterns: string[]): string | undefined {
    return fieldNames.find(name =>
        patterns.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()))
    );
}

function getTypeScriptType(field: FieldAnalysis): string {
    if (field.searchcraft_type === 'bool') return 'boolean';
    if (field.searchcraft_type === 'f64' || field.searchcraft_type === 'u64') return 'number';
    if (field.is_array) return 'string[]';
    return 'string';
}

function generateSearchResultTemplate(analysis: JsonStructureAnalysis, appName: string): string {
    const fields = analysis.fields;
    const fieldNames = Object.keys(fields);

    const titleField = findFieldByPatterns(fieldNames, ["title", "name", "headline", "heading"]) || fieldNames[0];
    const descriptionField = findFieldByPatterns(fieldNames, ["description", "overview", "summary", "content", "body"]);
    const imageField = findFieldByPatterns(fieldNames, ["image", "photo", "picture", "poster", "thumbnail"]);

    const dateField = fieldNames.find(name =>
        fields[name].searchcraft_type === 'datetime' ||
        findFieldByPatterns([name], ["date", "time", "created", "published", "updated"])
    );

    const interfaceFields = fieldNames.map(fieldName => {
        const field = fields[fieldName];
        const tsType = getTypeScriptType(field);
        return `\t${fieldName}: ${tsType};`;
    }).join('\n');

    let templateHtml = `
  <div class="search-result-item">`;

    if (imageField) {
        templateHtml += `
    <div class="result-image">
      <img src="\${data.${imageField}}" alt="\${data.${titleField}}" onerror="this.src='https://via.placeholder.com/200x150/374151/9CA3AF?text=No+Image'" />
    </div>`;
    }

    templateHtml += `
    <div class="result-content">
      <h3 class="result-title">\${data.${titleField}}</h3>`;

    if (dateField) {
        templateHtml += `
      <p class="result-date">\${data.${dateField}}</p>`;
    }

    if (descriptionField) {
        templateHtml += `
      <p class="result-description">\${data.${descriptionField}}</p>`;
    }

    // Add other important fields (reusing existing field filtering patterns)
    const excludedFields = [titleField, descriptionField, imageField, dateField];
    const mediaPatterns = ["image", "thumbnail", "photo", "video", "path", "poster", "url", "link"];

    const otherFields = fieldNames.filter(name =>
        !excludedFields.includes(name) &&
        fields[name].searchcraft_type === 'text' &&
        !fields[name].is_array &&
        !mediaPatterns.some(pattern => name.toLowerCase().includes(pattern)) // Exclude media fields
    ).slice(0, 2); // Limit to 2 additional fields

    otherFields.forEach(fieldName => {
        templateHtml += `
      <p class="result-field"><strong>${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}:</strong> \${data.${fieldName}}</p>`;
    });

    // Add array fields as tags
    const arrayFields = fieldNames.filter(name => fields[name].is_array).slice(0, 2);
    arrayFields.forEach(fieldName => {
        templateHtml += `
      <div class="result-tags">
        \${data.${fieldName} && data.${fieldName}.length > 0 ? data.${fieldName}.map(item => \`<span class="tag">\${item}</span>\`).join('') : ''}
      </div>`;
    });

    templateHtml += `
    </div>
  </div>`;



    return `import type { SearchResultTemplate } from "@searchcraft/javascript-sdk";

/**
 * This type represents your ${appName} index schema.
 *
 * Update this type definition to match your schema as defined in Searchcraft.
 */
type ExampleSearchResultTemplateIndexSchema = {
${interfaceFields}
};

/**
 * The templating function used to render a ${appName} search result item.
 *
 * Documentation: https://docs.searchcraft.io/sdks/javascript/working-with-templates/
 */
export const ExampleSearchResultTemplate: SearchResultTemplate<
\tExampleSearchResultTemplateIndexSchema
> = (data, index, { html }) => html\`${templateHtml}
\`;`;
}

export const registerCreateViteApp = (server: McpServer) => {
    /**
     * Tool: create_vite_app
     * Creates a generic search app demo with the provided JSON dataset and Searchcraft configuration.
     * Analyzes the JSON structure and generates appropriate search templates.
     */
    server.tool(
        "create_vite_app",
        "Creates a generic search app demo by analyzing a JSON dataset and generating a Vite app with Searchcraft integration",
        {
            request: CreateViteAppSchema.describe(
                "Complete request to create a Vite app from JSON dataset"
            ),
        },
        async ({ request }) => {
            const {
                data_source,
                data_path,
                app_name,
                VITE_ENDPOINT_URL,
                VITE_INDEX_NAME,
                VITE_READ_KEY,
                sample_size = 50,
                search_fields,
                weight_multipliers
            } = request;
            debugLog("[Tool Call] create_vite_app");
            try {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                const projectRoot = resolve(__dirname, "../");

                debugLog(`Tool file location: ${__filename}`);
                debugLog(`Using project root: ${projectRoot}`);

                // Verify we found the right directory by checking for package.json
                try {
                    await access(join(projectRoot, "package.json"));
                } catch {
                    return createErrorResponse(`Could not find package.json at expected project root: ${projectRoot}`);
                }

                // Step 1: Load and analyze JSON data
                debugLog("Step 1: Loading and analyzing JSON data");
                let jsonData: any;

                if (data_source === "url") {
                    debugLog(`Fetching JSON from URL: ${data_path}`);
                    try {
                        const response = await fetch(data_path);
                        if (!response.ok) {
                            return createErrorResponse(`Failed to fetch JSON from URL: ${response.status} ${response.statusText}`);
                        }
                        const jsonText = await response.text();
                        jsonData = JSON.parse(jsonText);
                    } catch (error) {
                        return createErrorResponse(`Failed to fetch or parse JSON from URL: ${error}`);
                    }
                } else {
                    debugLog(`Reading JSON from file: ${data_path}`);
                    try {
                        const filePath = resolve(data_path);
                        await access(filePath);
                        const fileContent = await readFile(filePath, "utf-8");
                        jsonData = JSON.parse(fileContent);
                    } catch (error) {
                        return createErrorResponse(`Failed to read or parse JSON from file: ${error}`);
                    }
                }

                // Step 2: Analyze JSON structure
                debugLog("Step 2: Analyzing JSON structure");

                // Check if data is nested and provide helpful info
                if (!Array.isArray(jsonData) && typeof jsonData === "object" && jsonData !== null) {
                    // Simple check for immediate array properties (for logging purposes)
                    const immediateArrays = Object.keys(jsonData)
                        .filter(key => Array.isArray(jsonData[key]))
                        .map(key => ({ key, length: jsonData[key].length }));

                    if (immediateArrays.length > 0) {
                        debugLog(`Detected nested data structure with ${immediateArrays.length} immediate array(s). Analyzer will find the best array to use.`);
                    }
                }

                const analysis = analyzeJsonStructure(jsonData, sample_size);
                debugLog(`Analyzed ${analysis.total_objects_analyzed} objects with ${Object.keys(analysis.fields).length} unique fields`);

                // Use provided search_fields or fall back to suggested ones
                const finalSearchFields = search_fields || analysis.suggested_search_fields;
                const finalWeightMultipliers = weight_multipliers || analysis.suggested_weight_multipliers;

                debugLog(`Analysis complete. Found ${Object.keys(analysis.fields).length} fields`);
                debugLog(`Search fields: ${finalSearchFields.join(", ")}`);

                // Step 3: Setup app directory
                debugLog("Step 3: Setting up app directory");
                const appsRoot = join(projectRoot, "apps");
                const appDir = join(appsRoot, app_name);

                debugLog(`Creating apps directory at: ${appsRoot}`);
                try {
                    await mkdir(appsRoot, { recursive: true });
                    debugLog(`Successfully created apps directory`);
                } catch (error) {
                    return createErrorResponse(`Failed to create apps directory at ${appsRoot}: ${error}`);
                }

                try {
                    await access(appDir);
                    debugLog(`Removing existing app directory at: ${appDir}`);
                    await rm(appDir, { recursive: true, force: true });
                } catch {
                    // Directory doesn't exist, which is fine
                }

                // Step 4: Clone template
                debugLog(`Step 4: Cloning template to: ${appDir}`);
                try {
                    await execAsync(
                        `/usr/bin/git clone --depth 1 https://github.com/searchcraft-inc/vite-react-searchcraft-template.git ${app_name}`,
                        {
                            cwd: appsRoot,
                            timeout: 60000 // 1 minute timeout
                        }
                    );
                } catch (error) {
                    return createErrorResponse(`Failed to clone template repository: ${error}`);
                }

                // Step 5: Install dependencies
                debugLog(`Step 5: Installing dependencies in: ${appDir}`);
                try {
                    const installEnv = {
                        PATH: `$/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin/`,
                        SHELL: "/bin/bash"
                    };

                    debugLog(`Starting dependency installation (this may take 30-60 seconds)...`);

                    try {
                        // Try yarn first (since template has yarn.lock)
                        await execAsync('yarn', {
                            cwd: appDir,
                            timeout: 180000, // 3 minutes timeout
                            env: { ...process.env, ...installEnv }
                        });
                        debugLog("Dependencies installed successfully with yarn");
                    } catch (installError) {
                        debugLog("Yarn install failed, attempting cleanup and npm install...");

                        // Clean up node_modules
                        try {
                            await execAsync("/bin/rm -rf node_modules", {
                                cwd: appDir,
                                env: { ...process.env, ...installEnv }
                            });
                            debugLog("Cleaned up node_modules");
                        } catch (cleanupError) {
                            debugLog("Cleanup failed, continuing with npm install attempt");
                        }

                        // Try npm install
                        await execAsync('npm install', {
                            cwd: appDir,
                            timeout: 180000, // 3 minutes timeout
                            env: { ...process.env, ...installEnv }
                        });
                        debugLog("Dependencies installed successfully with npm");
                    }
                } catch (error) {
                    return createErrorResponse(`Failed to install dependencies: ${error}`);
                }

                // Step 6: Create .env file
                debugLog("Step 6: Creating .env file with provided configuration");
                const envContent = `VITE_ENDPOINT_URL=${VITE_ENDPOINT_URL}
VITE_INDEX_NAME=${VITE_INDEX_NAME}
VITE_READ_KEY=${VITE_READ_KEY}`;

                try {
                    await writeFile(join(appDir, ".env"), envContent);
                    debugLog(".env file created successfully");
                } catch (error) {
                    return createErrorResponse(`Failed to create .env file: ${error}`);
                }

                // Step 7: Generate schema files
                debugLog("Step 7: Generating schema files");

                // Create components directory
                try {
                    await mkdir(join(appDir, "src", "components"), { recursive: true });
                    debugLog("Components directory created");
                } catch (error) {
                    return createErrorResponse(`Failed to create components directory: ${error}`);
                }

                // Generate schema based on analysis (reusing existing logic)
                const fields = generateSchemaFields(analysis);

                const exampleSchema = {
                    "index": {
                        "name": VITE_INDEX_NAME,
                        "search_fields": finalSearchFields,
                        "fields": fields,
                        ...(Object.keys(finalWeightMultipliers).length > 0 && {
                            "weight_multipliers": finalWeightMultipliers
                        })
                    }
                };

                // Generate sample data from the first few items
                let exampleData: any[] = [];
                if (Array.isArray(jsonData)) {
                    exampleData = jsonData.slice(0, Math.min(3, jsonData.length));
                } else {
                    exampleData = [jsonData];
                }

                // Write schema files
                try {
                    await writeFile(
                        join(appDir, "ExampleSearchResultTemplateIndexSchema.json"),
                        JSON.stringify(exampleSchema, null, 2)
                    );
                    debugLog("Updated ExampleSearchResultTemplateIndexSchema.json");
                } catch (error) {
                    return createErrorResponse(`Failed to update ExampleSearchResultTemplateIndexSchema.json: ${error}`);
                }

                try {
                    await writeFile(
                        join(appDir, "ExampleSearchResultTemplate.json"),
                        JSON.stringify(exampleData, null, 2)
                    );
                    debugLog("Updated ExampleSearchResultTemplate.json");
                } catch (error) {
                    return createErrorResponse(`Failed to update ExampleSearchResultTemplate.json: ${error}`);
                }

                // Step 8: Generate dynamic search result template
                debugLog("Step 8: Generating dynamic search result template");
                const templateTs = generateSearchResultTemplate(analysis, app_name);

                try {
                    await writeFile(
                        join(appDir, "src", "ExampleSearchResultTemplate.ts"),
                        templateTs
                    );
                    debugLog("Updated src/ExampleSearchResultTemplate.ts");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/ExampleSearchResultTemplate.ts: ${error}`);
                }

                // Step 9: Update App.tsx
                debugLog("Step 9: Updating App.tsx");
                const appTsx = `import { useEffect, useMemo } from "react";
import {
\tSearchcraft,
\tSearchcraftSearchResults,
\tSearchcraftInputForm,
\tSearchcraftTheme,
} from "@searchcraft/react-sdk";

import reactLogo from "./assets/react.svg";
import searchcraftLogo from "./assets/searchcraft.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { ExampleSearchResultTemplate } from "./ExampleSearchResultTemplate";
import { WelcomeMessage } from "./WelcomeMessage";
import { WelcomeFooter } from "./WelcomeFooter";

const INDEX_NAME = import.meta.env.VITE_INDEX_NAME;
const READ_KEY = import.meta.env.VITE_READ_KEY;
const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL;

function App() {
\tconst hasEnvVars = useMemo(() => INDEX_NAME && READ_KEY && ENDPOINT_URL, []);

\tuseEffect(() => {
\t\tif (hasEnvVars) {
\t\t\tnew Searchcraft({
\t\t\t\treadKey: READ_KEY,
\t\t\t\tendpointURL: ENDPOINT_URL,
\t\t\t\tindex: [INDEX_NAME],
\t\t\t});
\t\t}
\t}, [hasEnvVars]);

\treturn (
\t\t<>
\t\t\t<header className="top">
\t\t\t\t<div>
\t\t\t\t\t<a href="https://vite.dev" target="_blank">
\t\t\t\t\t\t<img src={viteLogo} className="logo" alt="Vite logo" />
\t\t\t\t\t</a>
\t\t\t\t\t<a href="https://react.dev" target="_blank">
\t\t\t\t\t\t<img src={reactLogo} className="logo react" alt="React logo" />
\t\t\t\t\t</a>
\t\t\t\t\t<a href="https://docs.searchcraft.io" target="_blank">
\t\t\t\t\t\t<img
\t\t\t\t\t\t\tsrc={searchcraftLogo}
\t\t\t\t\t\t\tclassName="logo react"
\t\t\t\t\t\t\talt="Searchcraft logo"
\t\t\t\t\t\t/>
\t\t\t\t\t</a>
\t\t\t\t</div>
\t\t\t\t<h1>Vite + React + Searchcraft</h1>
\t\t\t\t<h2>${app_name.charAt(0).toUpperCase() + app_name.slice(1)} Search</h2>
\t\t\t</header>

\t\t\t{hasEnvVars && (
\t\t\t\t<section style={{ width: "95%", maxWidth: "1400px" }}>
\t\t\t\t\t<div style={{ marginBottom: 20, maxWidth: 700, margin: "0 auto 20px auto" }}>
\t\t\t\t\t\t<SearchcraftInputForm
\t\t\t\t\t\t\tautoSearch={true}
\t\t\t\t\t\t\tplaceholderValue={"Search ${app_name}..."}
\t\t\t\t\t\t/>
\t\t\t\t\t</div>
\t\t\t\t\t<SearchcraftSearchResults template={ExampleSearchResultTemplate} />
\t\t\t\t\t<p className="read-the-docs">Enter a search to get started.</p>
\t\t\t\t\t<SearchcraftTheme />
\t\t\t\t</section>
\t\t\t)}
\t\t\t{!hasEnvVars && <WelcomeMessage />}
\t\t\t<WelcomeFooter />
\t\t</>
\t);
}

export default App;`;

                try {
                    await writeFile(join(appDir, "src", "App.tsx"), appTsx);
                    debugLog("Updated src/App.tsx");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/App.tsx: ${error}`);
                }

                // Step 10: Update App.css with generic styling
                debugLog("Step 10: Updating App.css with generic styling");
                try {
                    // Read the existing App.css
                    const existingCss = await readFile(join(appDir, "src", "App.css"), 'utf-8');

                    // Add generic search result styles
                    const genericStyles = `

/* Searchcraft results container - make it flex for search result cards */
.searchcraft-search-results {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row !important;
  justify-content: flex-start;
  gap: 20px;
  max-width: none !important;
  width: 100%;
}

/* Generic search result item styling */
.search-result-item {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  width: 300px;
  min-height: 200px;
  display: flex;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #646cff;
}

.result-image {
  margin-bottom: 12px;
}

.result-image img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-title {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
  line-height: 1.3;
}

.result-date {
  font-size: 0.85em;
  color: #888;
  margin: 0 0 8px 0;
}

.result-description {
  font-size: 0.9em;
  color: #ccc;
  margin: 0 0 12px 0;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.result-field {
  font-size: 0.85em;
  color: #aaa;
  margin: 4px 0;
}

.result-field strong {
  color: #fff;
}

.result-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: #333;
  color: #fff;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75em;
  border: 1px solid #555;
}

/* Responsive design */
@media (max-width: 768px) {
  .searchcraft-search-results {
    flex-direction: column;
    align-items: center;
  }

  .search-result-item {
    width: 100%;
    max-width: 400px;
  }
}`;

                    const updatedCss = existingCss + genericStyles;
                    await writeFile(join(appDir, "src", "App.css"), updatedCss);
                    debugLog("Updated src/App.css with generic search result styles");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/App.css: ${error}`);
                }

                debugLog(`${app_name} app setup completed successfully`);

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ ${app_name.charAt(0).toUpperCase() + app_name.slice(1)} Search App setup complete!

The app has been created in: ${appDir}

Configuration:
- App Name: ${app_name}
- Data Source: ${data_source === "url" ? data_path : `file: ${data_path}`}
- Endpoint URL: ${VITE_ENDPOINT_URL}
- Index Name: ${VITE_INDEX_NAME}
- Read Key: ${VITE_READ_KEY}

Analysis Summary:
- Total objects analyzed: ${analysis.total_objects_analyzed}
- Fields found: ${Object.keys(analysis.fields).length}
- Search fields: ${finalSearchFields.join(", ")}
${Object.keys(finalWeightMultipliers).length > 0 ? `- Weight multipliers: ${Object.entries(finalWeightMultipliers).map(([k, v]) => `${k}:${v}`).join(", ")}` : ""}

Files created/updated:
- ExampleSearchResultTemplateIndexSchema.json - Schema definition
- ExampleSearchResultTemplate.json - Sample data
- src/ExampleSearchResultTemplate.ts - Dynamic search result template
- .env - Searchcraft configuration
- src/App.tsx - Updated with app-specific branding

Next steps:
1. Navigate to the app directory: cd demos/${app_name}
2. Start the development server: yarn dev
3. The browser should open automatically at http://localhost:5173

The template includes:
- React + Vite setup with Searchcraft SDK
- Dynamically generated search schema based on your JSON data
- Responsive search interface with auto-generated result templates
- Environment configuration for your Searchcraft instance`
                        }
                    ]
                };

            } catch (error) {
                debugLog(`Error in create_vite_app: ${error}`);
                return createErrorResponse(`Failed to create vite app: ${error}`);
            }
        }
    );
};
