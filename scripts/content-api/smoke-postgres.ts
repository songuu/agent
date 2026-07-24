import {
  loadContentBackendConfig,
  openContentReadRepository,
} from "./repository.ts";

const expectedResources = [
  ["frontier", "slug"],
  ["interviews", "slug"],
  ["glossary", "slug"],
  ["news", "external_id"],
  ["notion", "notion_page_id"],
] as const;

const config = loadContentBackendConfig();
if (!config || config.driver !== "postgres") {
  throw new Error("PostgreSQL Content API smoke requires CONTENT_REPOSITORY_DRIVER=postgres.");
}

const handle = await openContentReadRepository(config);
try {
  const tables = [];
  for (const [resource, key] of expectedResources) {
    const page = await handle.repository.read({
      resource,
      fields: [key],
      filters: [],
      sort: [{ field: key, direction: "asc" }],
      limit: 1,
      offset: 0,
      includeTotal: true,
    });
    tables.push({
      resource,
      totalCount: page.totalCount,
      sampleKeyPresent: typeof page.items[0]?.[key] === "string",
    });
  }
  process.stdout.write(`${JSON.stringify({ driver: config.driver, tables })}\n`);
} finally {
  await handle.close();
}
