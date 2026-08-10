import { createHash } from "node:crypto";

export interface ContractError {
  code: string;
  message: string;
  details?: Readonly<Record<string, unknown>>;
}

export type ContractResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ContractError };

export interface VersionRef {
  id: string;
  version: string;
  digest: string;
}

export interface ProvenanceRef {
  sourceId: string;
  version: string;
  observedAt: string;
  location?: string;
}

export interface EvidenceRef {
  id: string;
  kind: "artifact" | "state" | "trace" | "approval" | "test";
  digest: string;
  location: string;
}

export interface ArtifactRef {
  id: string;
  version: string;
  digest: string;
  location?: string;
}

export function succeed<T>(value: T): ContractResult<T> {
  return { ok: true, value };
}

export function reject(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ContractResult<never> {
  return { ok: false, error: { code, message, ...(details ? { details } : {}) } };
}

const FLOATING_VERSIONS = new Set(["latest", "current", "stable", "default", "auto"]);

function isFloatingVersion(value: string): boolean {
  return FLOATING_VERSIONS.has(value.trim().toLowerCase());
}

export function validateVersionRef(ref: unknown, field: string): ContractResult<VersionRef> {
  if (!ref || typeof ref !== "object") {
    return reject("INVALID_VERSION_REF", `${field} must include id, version, and digest`, { field });
  }
  const candidate = ref as Partial<VersionRef>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.version !== "string" ||
    typeof candidate.digest !== "string" ||
    !candidate.id.trim() ||
    !candidate.version.trim() ||
    !candidate.digest.trim()
  ) {
    return reject("INVALID_VERSION_REF", `${field} must include id, version, and digest`, { field });
  }
  if (isFloatingVersion(candidate.version)) {
    return reject("FLOATING_VERSION", `${field} must pin an immutable version`, {
      field,
      version: candidate.version,
    });
  }
  return succeed(candidate as VersionRef);
}

export function validateProvenanceRef(
  ref: unknown,
  field: string,
): ContractResult<ProvenanceRef> {
  if (!ref || typeof ref !== "object") {
    return reject("INVALID_PROVENANCE_REF", `${field} must be a provenance reference`, { field });
  }
  const candidate = ref as Partial<ProvenanceRef>;
  if (
    typeof candidate.sourceId !== "string" ||
    !candidate.sourceId.trim() ||
    typeof candidate.version !== "string" ||
    !candidate.version.trim() ||
    isFloatingVersion(candidate.version) ||
    typeof candidate.observedAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.observedAt)) ||
    (candidate.location !== undefined &&
      (typeof candidate.location !== "string" || !candidate.location.trim()))
  ) {
    return reject("INVALID_PROVENANCE_REF", `${field} contains invalid lineage fields`, { field });
  }
  return succeed(candidate as ProvenanceRef);
}

export function validateArtifactRef(
  ref: unknown,
  field: string,
): ContractResult<ArtifactRef> {
  const versionValidation = validateVersionRef(ref, field);
  if (!versionValidation.ok) {
    return reject("INVALID_ARTIFACT_REF", `${field} must be a pinned artifact reference`, {
      field,
      cause: versionValidation.error.code,
    });
  }
  const candidate = ref as ArtifactRef;
  if (
    candidate.location !== undefined &&
    (typeof candidate.location !== "string" || !candidate.location.trim())
  ) {
    return reject("INVALID_ARTIFACT_REF", `${field}.location cannot be empty`, { field });
  }
  return succeed({
    id: candidate.id,
    version: candidate.version,
    digest: candidate.digest,
    ...(candidate.location ? { location: candidate.location } : {}),
  });
}

const EVIDENCE_KINDS = new Set<EvidenceRef["kind"]>([
  "artifact",
  "state",
  "trace",
  "approval",
  "test",
]);

export function validateEvidenceRef(ref: unknown, field: string): ContractResult<EvidenceRef> {
  if (!ref || typeof ref !== "object") {
    return reject("INVALID_EVIDENCE_REF", `${field} must be a complete evidence reference`, { field });
  }
  const candidate = ref as Partial<EvidenceRef>;
  if (
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    !candidate.kind ||
    !EVIDENCE_KINDS.has(candidate.kind) ||
    typeof candidate.digest !== "string" ||
    !candidate.digest.trim() ||
    typeof candidate.location !== "string" ||
    !candidate.location.trim()
  ) {
    return reject("INVALID_EVIDENCE_REF", `${field} must be a complete evidence reference`, { field });
  }
  return succeed({
    id: candidate.id,
    kind: candidate.kind,
    digest: candidate.digest,
    location: candidate.location,
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .filter((key) => record[key] !== undefined)
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

export function stableSerialize(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function stableDigest(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableSerialize(value)).digest("hex")}`;
}

export function isDenseArray(value: unknown): value is readonly unknown[] {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) return false;
  }
  return true;
}

export function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return Object.freeze(value);
}

export function copyVersionRef(ref: VersionRef): VersionRef {
  return { id: ref.id, version: ref.version, digest: ref.digest };
}

export function copyEvidenceRef(ref: EvidenceRef): EvidenceRef {
  return { id: ref.id, kind: ref.kind, digest: ref.digest, location: ref.location };
}

export function copyProvenanceRef(ref: ProvenanceRef): ProvenanceRef {
  return {
    sourceId: ref.sourceId,
    version: ref.version,
    observedAt: ref.observedAt,
    ...(ref.location ? { location: ref.location } : {}),
  };
}
