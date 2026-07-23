import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

const SENSITIVE_FIELD = /(authorization|credential|secret|token|password|service.?role|anon.?key|database.?url|db.?url)/i;

function redactFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactFields);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_FIELD.test(key) ? "[redacted]" : redactFields(nested),
      ]),
    );
  }
  return value;
}

function assertMigrationId(migrationId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(migrationId)) {
    throw new Error("migration id must contain only letters, numbers, dot, underscore, or hyphen.");
  }
}

function isWithin(parent: string, candidate: string): boolean {
  const delta = relative(parent, candidate);
  return delta === "" || (!delta.startsWith("..") && !isAbsolute(delta));
}

/**
 * Reports contain counts/hashes only. A second string replacement protects
 * against an accidental secret embedded inside a thrown error message.
 */
export async function writeSafeArtifact(options: {
  readonly artifactRoot: string;
  readonly migrationId: string;
  readonly phase: string;
  readonly value: unknown;
  readonly knownSecrets: readonly string[];
}): Promise<string> {
  assertMigrationId(options.migrationId);
  if (!/^[a-z-]+$/i.test(options.phase)) throw new Error("artifact phase contains unsupported characters.");

  const workspaceRoot = resolve(process.cwd());
  const artifactRoot = resolve(options.artifactRoot);
  if (!isWithin(workspaceRoot, artifactRoot)) {
    throw new Error("artifactRoot must stay inside the current repository directory.");
  }
  const directory = resolve(artifactRoot, options.migrationId);
  const destination = resolve(directory, `${options.phase}.json`);
  if (!isWithin(artifactRoot, directory) || !isWithin(directory, destination)) {
    throw new Error("artifact destination escaped its migration directory.");
  }

  let serialized = `${JSON.stringify(redactFields(options.value), null, 2)}\n`;
  for (const secret of options.knownSecrets) {
    if (secret) serialized = serialized.split(secret).join("[redacted]");
  }
  await mkdir(directory, { recursive: true });
  await writeFile(destination, serialized, "utf8");
  return destination;
}
