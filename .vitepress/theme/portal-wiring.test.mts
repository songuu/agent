import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const config = readFileSync(".vitepress/config.mts", "utf8");
const theme = readFileSync(".vitepress/theme/index.ts", "utf8");
const informationArchitecture = readFileSync(".vitepress/site-information-architecture.ts", "utf8");

test("VitePress consumes the centralized portal information architecture", () => {
  assert.match(config, /from "\.\/site-information-architecture"/);
  assert.match(config, /nav:\s*PRIMARY_NAVIGATION/);
  assert.match(config, /sidebar:\s*CONTEXTUAL_SIDEBAR/);
  assert.doesNotMatch(config, /const sidebar:\s*DefaultTheme\.SidebarItem\[\]/);
  assert.doesNotMatch(config, /function buildCourseSidebar/);
  assert.match(config, /buttonText:\s*"搜索全站"/);
  assert.match(informationArchitecture, /PRIMARY_NAVIGATION:\s*DefaultTheme\.NavItem\[\]/);
  assert.match(informationArchitecture, /CONTEXTUAL_SIDEBAR:\s*DefaultTheme\.SidebarMulti/);
});

test("default theme installs the portal styles and progressive enhancement", () => {
  assert.match(theme, /import "\.\/portal-home\.css"/);
  assert.match(theme, /import "\.\/portal-home"/);
});
