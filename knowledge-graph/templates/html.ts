/**
 * 交互式知识图谱（"动图"）的 HTML 模板。
 *
 * 设计：单文件、自包含、零构建——Cytoscape.js 走 CDN，图数据内联进页面。
 * 直接用浏览器打开 knowledge-graph/output/index.html 即可：缩放、拖拽、按部分筛选、
 * 点击节点查看该概念的说明与关联文章。
 *
 * 实现注意：本文件用 TS 模板字符串拼出 HTML，其中**只有一处** ${dataJson} 插值；
 * 页面内的客户端脚本一律用字符串拼接书写、不使用反引号与 ${}，以免与外层模板冲突。
 */

export interface HtmlNode {
  id: string;
  label: string;
  chapter: string;
  chapterTitle: string;
  part: string;
  summary: string;
  articles: { title: string; url: string }[];
}

export interface HtmlEdge {
  source: string;
  target: string;
  type: string;
}

export interface HtmlData {
  parts: string[];
  nodes: HtmlNode[];
  edges: HtmlEdge[];
}

const CDN = "https://unpkg.com/cytoscape@3.30.2/dist/cytoscape.min.js";

export function buildHtml(data: HtmlData): string {
  const dataJson = JSON.stringify(data);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Agent 课程 · 交互式知识图谱</title>
<script src="${CDN}"></script>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif; }
  #app { display: flex; height: 100vh; }
  #cy { flex: 1; height: 100%; background: #0f1117; }
  #side {
    width: 320px; padding: 16px; overflow-y: auto;
    background: #171a23; color: #e6e6e6; border-left: 1px solid #2a2f3a;
  }
  #side h1 { font-size: 16px; margin: 0 0 8px; }
  #side h2 { font-size: 14px; margin: 18px 0 8px; color: #8ab4f8; }
  .hint { color: #9aa0aa; font-size: 12px; line-height: 1.6; }
  .filters label { display: block; font-size: 13px; margin: 4px 0; cursor: pointer; }
  .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
  #search { width: 100%; padding: 6px 8px; margin: 6px 0 4px; background: #0f1117; color: #e6e6e6; border: 1px solid #2a2f3a; border-radius: 4px; }
  #detail .label { font-size: 15px; font-weight: 600; }
  #detail .meta { font-size: 12px; color: #9aa0aa; margin: 4px 0 8px; }
  #detail .summary { font-size: 13px; line-height: 1.6; }
  #detail ul { padding-left: 18px; }
  #detail a { color: #8ab4f8; }
  .empty { color: #6b7280; font-style: italic; }
</style>
</head>
<body>
<div id="app">
  <div id="cy"></div>
  <div id="side">
    <h1>🗺️ 交互式知识图谱</h1>
    <p class="hint">滚轮缩放 · 拖拽平移 · 点击节点看详情。共 <b id="ncount">0</b> 个概念。</p>
    <input id="search" placeholder="搜索概念…" />
    <h2>按部分筛选</h2>
    <div class="filters" id="filters"></div>
    <h2>详情</h2>
    <div id="detail"><p class="empty">点击任意节点查看说明与关联文章。</p></div>
  </div>
</div>
<script>
var DATA = ${dataJson};

// 调色板：按部分分配颜色
var PALETTE = ["#4f8cff", "#34c759", "#ff9f0a", "#ff453a", "#bf5af2", "#5ac8fa", "#ffd60a", "#64d2ff", "#ff6482"];
var partColor = {};
DATA.parts.forEach(function (p, i) { partColor[p] = PALETTE[i % PALETTE.length]; });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

var nodes = DATA.nodes.map(function (n) {
  return { data: { id: n.id, label: n.label, part: n.part, color: partColor[n.part] || "#888", raw: n } };
});
var edges = DATA.edges.map(function (e, i) {
  return { data: { id: "e" + i, source: e.source, target: e.target, label: e.type } };
});

document.getElementById("ncount").textContent = String(DATA.nodes.length);

var cy = cytoscape({
  container: document.getElementById("cy"),
  elements: { nodes: nodes, edges: edges },
  style: [
    { selector: "node", style: {
      "background-color": "data(color)", "label": "data(label)", "color": "#e6e6e6",
      "font-size": 11, "text-valign": "center", "text-halign": "right", "text-margin-x": 4,
      "width": 16, "height": 16, "border-width": 0
    }},
    { selector: "edge", style: {
      "width": 1.2, "line-color": "#3a4150", "target-arrow-color": "#3a4150",
      "target-arrow-shape": "triangle", "curve-style": "bezier",
      "label": "data(label)", "font-size": 8, "color": "#7c8493", "text-rotation": "autorotate"
    }},
    { selector: ".faded", style: { "opacity": 0.12 } },
    { selector: ".hl", style: { "border-width": 3, "border-color": "#ffd60a" } }
  ],
  layout: { name: "cose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 90, padding: 30 }
});

function showDetail(n) {
  var html = '<div class="label">' + esc(n.label) + "</div>";
  html += '<div class="meta">章节：' + esc(n.chapter) + " · " + esc(n.chapterTitle) + "<br/>部分：" + esc(n.part) + "</div>";
  html += '<div class="summary">' + (n.summary ? esc(n.summary) : '<span class="empty">（暂无说明）</span>') + "</div>";
  html += "<h2>关联文章</h2>";
  if (n.articles && n.articles.length) {
    html += "<ul>";
    n.articles.forEach(function (a) {
      html += '<li><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.title) + "</a></li>";
    });
    html += "</ul>";
  } else {
    html += '<p class="empty">暂无（可在 graph.ts 的 ARTICLES 中新增）。</p>';
  }
  document.getElementById("detail").innerHTML = html;
}

cy.on("tap", "node", function (evt) {
  var node = evt.target;
  cy.elements().addClass("faded");
  var nb = node.closedNeighborhood();
  nb.removeClass("faded");
  cy.elements().removeClass("hl");
  node.addClass("hl");
  showDetail(node.data("raw"));
});
cy.on("tap", function (evt) {
  if (evt.target === cy) { cy.elements().removeClass("faded hl"); }
});

// 部分筛选
var filters = document.getElementById("filters");
DATA.parts.forEach(function (p) {
  var id = "f_" + p.replace(/[^a-zA-Z0-9]/g, "_");
  var row = document.createElement("label");
  row.innerHTML = '<input type="checkbox" checked data-part="' + esc(p) + '" /> <span class="swatch" style="background:' + (partColor[p] || "#888") + '"></span>' + esc(p);
  filters.appendChild(row);
});
filters.addEventListener("change", function () {
  var enabled = {};
  var boxes = filters.querySelectorAll("input[type=checkbox]");
  for (var i = 0; i < boxes.length; i++) { enabled[boxes[i].getAttribute("data-part")] = boxes[i].checked; }
  cy.nodes().forEach(function (n) {
    n.style("display", enabled[n.data("part")] ? "element" : "none");
  });
});

// 搜索高亮
document.getElementById("search").addEventListener("input", function (e) {
  var q = e.target.value.trim().toLowerCase();
  cy.elements().removeClass("faded hl");
  if (!q) return;
  cy.elements().addClass("faded");
  cy.nodes().forEach(function (n) {
    if (n.data("label").toLowerCase().indexOf(q) >= 0) { n.removeClass("faded").addClass("hl"); }
  });
});
</script>
</body>
</html>`;
}
