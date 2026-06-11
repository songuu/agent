import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createDemoRunnerServer } from "./server.mjs";

const TOKEN = "test-token";
const ALLOWED_HOST = "127.0.0.1:5174";
const ALLOWED_ORIGIN = "http://localhost:5173";
const PRODUCTION_HOST = "songuu.top";
const PRODUCTION_ORIGIN = "https://songuu.top";

interface RequestOptions {
  path?: string;
  method?: string;
  host?: string;
  origin?: string;
  runnerHeader?: string;
  token?: string;
  headers?: Record<string, string>;
}

interface ResponseSnapshot {
  statusCode: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

async function withServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const server = createDemoRunnerServer({
    token: TOKEN,
    allowedHosts: [ALLOWED_HOST],
    allowedOrigins: [ALLOWED_ORIGIN],
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;

  try {
    return await fn(port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function withProductionServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const server = createDemoRunnerServer({
    token: TOKEN,
    requireToken: false,
    allowMissingOrigin: true,
    allowedHosts: [PRODUCTION_HOST],
    allowedOrigins: [PRODUCTION_ORIGIN],
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;

  try {
    return await fn(port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function request(port: number, options: RequestOptions = {}): Promise<ResponseSnapshot> {
  const headers: Record<string, string> = {};
  if (options.host !== undefined) headers.Host = options.host;
  if (options.origin !== undefined) headers.Origin = options.origin;
  if (options.runnerHeader !== undefined) headers["X-Demo-Runner"] = options.runnerHeader;
  if (options.token !== undefined) headers["X-Demo-Runner-Token"] = options.token;
  Object.assign(headers, options.headers);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: options.path ?? "/api/config",
        method: options.method ?? "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode ?? 0, body, headers: res.headers });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function legalHeaders(): RequestOptions {
  return {
    host: ALLOWED_HOST,
    origin: ALLOWED_ORIGIN,
    runnerHeader: "1",
    token: TOKEN,
  };
}

await withServer(async (port) => {
  const legal = await request(port, legalHeaders());
  assert.equal(legal.statusCode, 200, "legal same-origin config request should pass");
  assert.match(legal.body, /"hasKey"/, "config response must not be an empty success");
  assert.equal(
    legal.headers["access-control-allow-origin"],
    ALLOWED_ORIGIN,
    "legal config response should include CORS allow-origin",
  );

  const legalPreflight = await request(port, {
    host: ALLOWED_HOST,
    origin: ALLOWED_ORIGIN,
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "X-Demo-Runner, X-Demo-Runner-Token",
    },
  });
  assert.equal(legalPreflight.statusCode, 204, "legal CORS preflight should pass");
  assert.equal(
    legalPreflight.headers["access-control-allow-origin"],
    ALLOWED_ORIGIN,
    "legal preflight should echo the allowed origin",
  );

  const badPreflightHeader = await request(port, {
    host: ALLOWED_HOST,
    origin: ALLOWED_ORIGIN,
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "X-Demo-Runner, X-Not-Allowed",
    },
  });
  assert.equal(badPreflightHeader.statusCode, 403, "unknown CORS request headers must be rejected");

  const badOrigin = await request(port, {
    ...legalHeaders(),
    origin: "http://evil.example",
  });
  assert.equal(badOrigin.statusCode, 403, "foreign Origin must be rejected");

  const badHost = await request(port, {
    ...legalHeaders(),
    host: "evil.example:5174",
  });
  assert.equal(badHost.statusCode, 403, "foreign Host must be rejected");

  const missingRunnerHeader = await request(port, {
    ...legalHeaders(),
    runnerHeader: undefined,
  });
  assert.equal(missingRunnerHeader.statusCode, 403, "missing custom header must be rejected");

  const badToken = await request(port, {
    ...legalHeaders(),
    token: "wrong-token",
  });
  assert.equal(badToken.statusCode, 403, "wrong token must be rejected");

  const runViaGet = await request(port, {
    ...legalHeaders(),
    path: "/api/run?demo=01",
  });
  assert.equal(runViaGet.statusCode, 405, "run must reject GET");
});

await withProductionServer(async (port) => {
  const sameOriginConfig = await request(port, {
    host: PRODUCTION_HOST,
    runnerHeader: "1",
  });
  assert.equal(sameOriginConfig.statusCode, 200, "production same-origin config can omit Origin and token");

  const sameOriginHealth = await request(port, {
    host: PRODUCTION_HOST,
    runnerHeader: "1",
    path: "/api/health",
  });
  assert.equal(sameOriginHealth.statusCode, 200, "production health can omit Origin and token");

  const productionOrigin = await request(port, {
    host: PRODUCTION_HOST,
    origin: PRODUCTION_ORIGIN,
    runnerHeader: "1",
  });
  assert.equal(productionOrigin.statusCode, 200, "production allowed Origin should pass");

  const badProductionOrigin = await request(port, {
    host: PRODUCTION_HOST,
    origin: "https://evil.example",
    runnerHeader: "1",
  });
  assert.equal(badProductionOrigin.statusCode, 403, "production foreign Origin must be rejected");

  const badProductionHost = await request(port, {
    host: "evil.example",
    runnerHeader: "1",
  });
  assert.equal(badProductionHost.statusCode, 403, "production foreign Host must be rejected");

  const missingProductionHeader = await request(port, {
    host: PRODUCTION_HOST,
  });
  assert.equal(missingProductionHeader.statusCode, 403, "production custom header is still required");
});

console.log("security.test.mts: ok");
