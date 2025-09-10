import * as esbuild from "esbuild";

async function build() {
    try {
        // Build HTTP server
        await esbuild.build({
            bundle: true,
            platform: "node",
            target: "node18",
            format: "esm",
            sourcemap: true,
            tsconfig: "tsconfig.json",
            external: [
                "@modelcontextprotocol/*",
                "express",
                "zod",
                "dotenv/config",
            ],
            entryPoints: ["src/index.ts"],
            outfile: "dist/server.js",
        });

        // Build stdio server
        await esbuild.build({
            bundle: true,
            platform: "node",
            target: "node18",
            format: "esm",
            sourcemap: true,
            tsconfig: "tsconfig.json",
            external: [
                "@modelcontextprotocol/*",
                "zod",
                "dotenv/config",
            ],
            entryPoints: ["src/stdio-server.ts"],
            outfile: "dist/stdio-server.js",
        });

        console.log("✅ Build complete!");
        console.log("📁 Output:");
        console.log("  - dist/server.js (HTTP server)");
        console.log("  - dist/stdio-server.js (stdio server for Claude Desktop)");
    } catch (error) {
        console.error("❌ Build failed:", error);
        process.exit(1);
    }
}

build();
