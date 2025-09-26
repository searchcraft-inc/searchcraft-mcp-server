import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, access, rm, readFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
    createErrorResponse,
    debugLog,
} from "../../helpers.js";

const execAsync = promisify(exec);

export const registerCreateMovieApp = (server: McpServer) => {
    /**
     * Tool: create_movie_app
     * Creates a movie search app demo with the provided Searchcraft configuration. Expects you to have created the index using Searchcraft's movie sample data. Requires git and node be installed. This too   l is meant to be run locally.
     */
    server.tool(
        "create_movie_app",
        "Creates a movie search app demo by cloning a template and configuring it with the provided Searchcraft endpoint, index name, and read key",
        {
            VITE_ENDPOINT_URL: z.string().describe("The Searchcraft endpoint URL"),
            VITE_INDEX_NAME: z.string().describe("The Searchcraft index name"),
            VITE_READ_KEY: z.string().describe("The Searchcraft read key"),
        },
        async ({ VITE_ENDPOINT_URL, VITE_INDEX_NAME, VITE_READ_KEY }) => {
            debugLog("[Tool Call] create_movie_app");
            try {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = dirname(__filename);
                //const projectRoot = resolve(__dirname, "../../../");
                const projectRoot = resolve(__dirname, "../");

                debugLog(`Tool file location: ${__filename}`);
                debugLog(`Using project root: ${projectRoot}`);

                // Verify we found the right directory by checking for package.json
                try {
                    await access(join(projectRoot, "package.json"));
                } catch {
                    return createErrorResponse(`Could not find package.json at expected project root: ${projectRoot}`);
                }

                const demosDir = join(projectRoot, "demos");
                const movieAppDir = join(demosDir, "movie-app");

                debugLog(`Creating demos directory at: ${demosDir}`);
                try {
                    await mkdir(demosDir, { recursive: true });
                    debugLog(`Successfully created demos directory`);
                } catch (error) {
                    return createErrorResponse(`Failed to create demos directory at ${demosDir}: ${error}`);
                }

                try {
                    await access(movieAppDir);
                    debugLog(`Removing existing movie-app directory at: ${movieAppDir}`);
                    await rm(movieAppDir, { recursive: true, force: true });
                } catch {
                    // Directory doesn't exist, which is fine
                }

                debugLog(`Cloning template to: ${movieAppDir}`);
                try {
                    await execAsync(
                        "/usr/bin/git clone --depth 1 https://github.com/searchcraft-inc/vite-react-searchcraft-template.git movie-app",
                        {
                            cwd: demosDir,
                            timeout: 60000 // 1 minute timeout
                        }
                    );
                } catch (error) {
                    return createErrorResponse(`Failed to clone template repository: ${error}`);
                }


                debugLog(`Installing dependencies in: ${movieAppDir}`);
                try {
                    const installEnv = {
                        PATH: `$/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin/`,
                        SHELL: "/bin/bash"
                    };

                    debugLog(`Starting dependency installation (this may take 30-60 seconds)...`);

                    try {
                        // Try yarn first (since template has yarn.lock)
                        await execAsync('yarn', {
                            cwd: movieAppDir,
                            timeout: 180000, // 3 minutes timeout
                            env: { ...process.env, ...installEnv }
                        });
                        debugLog("Dependencies installed successfully with yarn");
                    } catch (installError) {
                        debugLog("Yarn install failed, attempting cleanup and npm install...");

                        // Clean up node_modules
                        try {
                            await execAsync("/bin/rm -rf node_modules", {
                                cwd: movieAppDir,
                                env: { ...process.env, ...installEnv }
                            });
                            debugLog("Cleaned up node_modules");
                        } catch (cleanupError) {
                            debugLog("Cleanup failed, continuing with npm install attempt");
                        }

                        // Retry installation with npm
                        debugLog("Retrying with npm install...");
                        await execAsync('npm install --legacy-peer-deps', {
                            cwd: movieAppDir,
                            timeout: 240000, // 4 minutes timeout for retry
                            env: { ...process.env, ...installEnv }
                        });
                        debugLog("Dependencies installed successfully with npm after cleanup");
                    }
                } catch (error) {
                    return createErrorResponse(`Failed to install dependencies: ${error}`);
                }

                debugLog("Creating .env file with provided configuration");
                const envContent = `VITE_ENDPOINT_URL=${VITE_ENDPOINT_URL}
VITE_INDEX_NAME=${VITE_INDEX_NAME}
VITE_READ_KEY=${VITE_READ_KEY}`;

                try {
                    await writeFile(join(movieAppDir, ".env"), envContent);
                    debugLog(".env file created successfully");
                } catch (error) {
                    return createErrorResponse(`Failed to create .env file: ${error}`);
                }

                try {
                    await mkdir(join(movieAppDir, "src", "components"), { recursive: true });
                    debugLog("Components directory created");
                } catch (error) {
                    return createErrorResponse(`Failed to create components directory: ${error}`);
                }
                // Create ExampleSearchResultTemplateIndexSchema
                const exampleSchema = {
                    "index": {
                        "name": "movie-search-demo",
                        "search_fields": ["title", "keywords", "overview", "actors", "director", "genres"],
                        "fields": {
                            "id": {
                                "type": "text",
                                "required": true,
                                "stored": true,
                                "indexed": true,
                                "fast": false
                            },
                            "title": {
                                "type": "text",
                                "required": true,
                                "stored": true,
                                "indexed": true,
                                "fast": false
                            },
                            "overview": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": false
                            },
                            "poster": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": false,
                                "fast": false
                            },
                            "backdrop_path": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": false,
                                "fast": false
                            },
                            "genres": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": false,
                                "multi": true
                            },
                            "release_date": {
                                "type": "u64",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": true
                            },
                            "keywords": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": false,
                                "multi": true
                            },
                            "actors": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": false,
                                "multi": true
                            },
                            "director": {
                                "type": "text",
                                "required": false,
                                "stored": true,
                                "indexed": true,
                                "fast": false
                            }
                        },
                        "weight_multipliers": {
                            "title": 2.0,
                            "keywords": 1.0,
                            "overview": 0.5,
                            "actors": 1.0,
                            "director": 1.0,
                            "genres": 1.0
                        },
                        "language": "en",
                        "enable_language_stemming": false,
                        "exclude_stop_words": true,
                        "auto_commit_delay": 3
                    }
                };

                const exampleData = [
                    {
                        "id": "1096838",
                        "title": "Here After",
                        "overview": "When her teen daughter displays increasingly disturbing behavior after a near death experience, a mother becomes convinced the girl brought something evil back from the other side.",
                        "poster": "https://image.tmdb.org/t/p/w500/ihwownG2VTy0jwhMWDrTUFocgIH.jpg",
                        "backdrop_path": "https://image.tmdb.org/t/p/w500/511jBKwGSGatYNTBwWKAqhsJt26.jpg",
                        "genres": ["Horror", "Thriller"],
                        "release_date": 2024,
                        "keywords": [],
                        "actors": ["Connie Britton", "Giovanni Cirfiera", "Tommaso Basili"],
                        "director": "Robert Salerno"
                    },
                    {
                        "id": "533535",
                        "title": "Deadpool & Wolverine",
                        "overview": "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
                        "poster": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                        "backdrop_path": "https://image.tmdb.org/t/p/w500/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
                        "genres": ["Action", "Comedy", "Science Fiction"],
                        "release_date": "2024-07-26T00:00:00Z",
                        "keywords": ["superhero", "marvel", "mutant"],
                        "actors": ["Ryan Reynolds", "Hugh Jackman", "Emma Corrin"],
                        "director": "Shawn Levy"
                    },
                    {
                        "id": "945961",
                        "title": "Alien: Romulus",
                        "overview": "While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.",
                        "poster": "https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
                        "backdrop_path": "https://image.tmdb.org/t/p/w500/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg",
                        "genres": ["Horror", "Science Fiction", "Thriller"],
                        "release_date": 2024,
                        "keywords": ["alien", "space", "horror"],
                        "actors": ["Cailee Spaeny", "David Jonsson", "Archie Renaux"],
                        "director": "Fede Álvarez"
                    }
                ];

                // Update ExampleSearchResultTemplateIndexSchema.json (root directory)
                try {
                    await writeFile(
                        join(movieAppDir, "ExampleSearchResultTemplateIndexSchema.json"),
                        JSON.stringify(exampleSchema, null, 2)
                    );
                    debugLog("Updated ExampleSearchResultTemplateIndexSchema.json");
                } catch (error) {
                    return createErrorResponse(`Failed to update ExampleSearchResultTemplateIndexSchema.json: ${error}`);
                }

                // Update ExampleSearchResultTemplate.json (root directory)
                try {
                    await writeFile(
                        join(movieAppDir, "ExampleSearchResultTemplate.json"),
                        JSON.stringify(exampleData, null, 2)
                    );
                    debugLog("Updated ExampleSearchResultTemplate.json");
                } catch (error) {
                    return createErrorResponse(`Failed to update ExampleSearchResultTemplate.json: ${error}`);
                }

                // Update ExampleSearchResultTemplate.ts (src directory)
                const movieTemplateTs = `import type { SearchResultTemplate } from "@searchcraft/javascript-sdk";

/**
 * This type represents your movie index schema.
 *
 * Update this type definition to match your schema as defined in Searchcraft.
 */
type ExampleSearchResultTemplateIndexSchema = {
	id: string;
	title: string;
	overview: string;
	poster: string;
	backdrop_path: string;
	genres: string[];
	release_date: number;
	keywords: string[];
	actors: string[];
	director: string;
};

/**
 * The templating function used to render a movie search result item.
 *
 * Documentation: https://docs.searchcraft.io/sdks/javascript/working-with-templates/
 */
export const ExampleSearchResultTemplate: SearchResultTemplate<
	ExampleSearchResultTemplateIndexSchema
> = (data, index, { html }) => html\`
  <div class="movie-search-result">
    <div class="movie-poster">
      <img src="\${data.poster}" alt="\${data.title}" onerror="this.src='https://via.placeholder.com/300x450/374151/9CA3AF?text=No+Image'" />
    </div>
    <div class="movie-content">
      <h2 class="movie-title">\${data.title}</h2>
      <p class="movie-year">\${data.release_date}</p>
      <div class="movie-genres">
        \${data.genres.map(genre => \`<span class="genre-tag">\${genre}</span>\`).join('')}
      </div>
      <p class="movie-overview">\${data.overview}</p>
      <div class="movie-credits">
        <p class="movie-director"><strong>Director:</strong> \${data.director}</p>
        <p class="movie-actors"><strong>Cast:</strong> \${data.actors.slice(0, 3).join(', ')}\${data.actors.length > 3 ? \` +\${data.actors.length - 3} more\` : ''}</p>
      </div>
    </div>
  </div>
\`;`;

                try {
                    await writeFile(
                        join(movieAppDir, "src", "ExampleSearchResultTemplate.ts"),
                        movieTemplateTs
                    );
                    debugLog("Updated src/ExampleSearchResultTemplate.ts");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/ExampleSearchResultTemplate.ts: ${error}`);
                }

                // Update App.tsx to use proper width for movie cards
                const appTsx = `import { useEffect, useMemo } from "react";
import {
	Searchcraft,
	SearchcraftSearchResults,
	SearchcraftInputForm,
	SearchcraftTheme,
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
	const hasEnvVars = useMemo(() => INDEX_NAME && READ_KEY && ENDPOINT_URL, []);

	useEffect(() => {
		if (hasEnvVars) {
			new Searchcraft({
				readKey: READ_KEY,
				endpointURL: ENDPOINT_URL,
				index: [INDEX_NAME],
			});
		}
	}, [hasEnvVars]);

	return (
		<>
			<header className="top">
				<div>
					<a href="https://vite.dev" target="_blank">
						<img src={viteLogo} className="logo" alt="Vite logo" />
					</a>
					<a href="https://react.dev" target="_blank">
						<img src={reactLogo} className="logo react" alt="React logo" />
					</a>
					<a href="https://docs.searchcraft.io" target="_blank">
						<img
							src={searchcraftLogo}
							className="logo react"
							alt="React logo"
						/>
					</a>
				</div>
				<h1>Vite + React + Searchcraft</h1>
			</header>

			{hasEnvVars && (
				<section style={{ width: "95%", maxWidth: "1400px" }}>
					<div style={{ marginBottom: 20, maxWidth: 700, margin: "0 auto 20px auto" }}>
						<SearchcraftInputForm
							autoSearch={true}
							placeholderValue={"Search"}
						/>
					</div>
					<SearchcraftSearchResults template={ExampleSearchResultTemplate} />
					<p className="read-the-docs">Enter a search to get started.</p>
					<SearchcraftTheme />
				</section>
			)}
			{!hasEnvVars && <WelcomeMessage />}
			<WelcomeFooter />
		</>
	);
}

export default App;`;

                try {
                    await writeFile(join(movieAppDir, "src", "App.tsx"), appTsx);
                    debugLog("Updated src/App.tsx with proper movie card layout");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/App.tsx: ${error}`);
                }

                // Update App.css to add movie card styling
                try {
                    // Read the existing App.css
                    const existingCss = await readFile(join(movieAppDir, "src", "App.css"), 'utf-8');

                    // Add movie card styles to the existing CSS
                    const movieCardStyles = `

/* Searchcraft results container - make it flex for movie cards */
.searchcraft-search-results {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row !important;
  justify-content: flex-start;
  gap: 0;
  max-width: none !important;
  width: 100%;
}

/* Movie search result styles */
.movie-search-result {
  width: 250px;
  flex-shrink: 0;
  margin: 8px;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.movie-search-result:hover {
  transform: scale(1.02);
}

.movie-poster {
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.movie-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-content {
  padding: 12px;
  color: white;
}

.movie-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.movie-year {
  font-size: 14px;
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.movie-genres {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.genre-tag {
  background: #7c3aed;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.movie-overview {
  font-size: 12px;
  color: #d1d5db;
  line-height: 1.4;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.movie-credits {
  font-size: 11px;
  color: #9ca3af;
}

.movie-director {
  margin: 0 0 4px 0;
}

.movie-actors {
  margin: 0;
}`;

                    const updatedCss = existingCss + movieCardStyles;
                    await writeFile(join(movieAppDir, "src", "App.css"), updatedCss);
                    debugLog("Updated src/App.css with movie card styles");
                } catch (error) {
                    return createErrorResponse(`Failed to update src/App.css: ${error}`);
                }

                // The template already has vite.config.js, so we'll leave it as is
                debugLog("Keeping existing vite.config.js from template");

                debugLog("Movie app setup completed successfully");

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Movie Search App setup complete!

The app has been created in: ${movieAppDir}

Configuration:
- Endpoint URL: ${VITE_ENDPOINT_URL}
- Index Name: ${VITE_INDEX_NAME}
- Read Key: ${VITE_READ_KEY}

Files updated:
- ExampleSearchResultTemplateIndexSchema.json - Updated with movie schema
- ExampleSearchResultTemplate.json - Updated with sample movie data
- .env - Configured with your Searchcraft credentials

Next steps:
1. Navigate to the movie-app directory: cd demos/movie-app
2. Start the development server: yarn dev
3. The browser should open automatically at http://localhost:5173

The template includes:
- React + Vite setup with Searchcraft SDK
- Pre-configured movie search schema
- Sample movie data (Horror, Action, Sci-Fi films)
- Responsive search interface
- Environment configuration for your Searchcraft instance`
                        }
                    ]
                };

            } catch (error) {
                debugLog(`Error in create_movie_app: ${error}`);
                return createErrorResponse(`Failed to create movie app: ${error}`);
            }
        }
    );
};
