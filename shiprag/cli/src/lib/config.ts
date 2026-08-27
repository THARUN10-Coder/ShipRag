import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ShipragConfig {
  projectId: string;
  docsDir: string;
  apiUrl: string; // SHIPRAG backend base URL for this project
}

const CONFIG_FILENAME = "shiprag.config.json";

export function configPath(cwd: string = process.cwd()): string {
  return join(cwd, CONFIG_FILENAME);
}

export function configExists(cwd: string = process.cwd()): boolean {
  return existsSync(configPath(cwd));
}

export function loadConfig(cwd: string = process.cwd()): ShipragConfig {
  const raw = readFileSync(configPath(cwd), "utf-8");
  return JSON.parse(raw) as ShipragConfig;
}

export function writeConfig(config: ShipragConfig, cwd: string = process.cwd()): void {
  writeFileSync(configPath(cwd), JSON.stringify(config, null, 2) + "\n");
}

export interface ShipragCredentials {
  token: string;
  email: string;
  userId: string;
}

export function credentialsPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ".";
  return join(home, ".shiprag_credentials.json");
}

export function saveCredentials(creds: ShipragCredentials): void {
  writeFileSync(credentialsPath(), JSON.stringify(creds, null, 2) + "\n");
}

export function loadCredentials(): ShipragCredentials | null {
  const p = credentialsPath();
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as ShipragCredentials;
}

