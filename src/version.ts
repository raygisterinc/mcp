import packageJson from "../package.json" with { type: "json" };

/** The package version, read from package.json so it is written in one place only. */
export const VERSION: string = packageJson.version;
