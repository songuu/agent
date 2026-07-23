---
layout: page
title: Agent 工程知识门户
description: 学 Agent、做项目、追前沿的一站式工程知识门户。
sidebar: false
aside: false
outline: false
---

<main class="agent-portal-home" data-agent-portal-home>
  <section class="agent-portal-hero" aria-labelledby="portal-title">
    <div class="agent-portal-hero__glow" aria-hidden="true"></div>
    <div class="agent-portal-hero__content">
      <p class="agent-portal-eyebrow"><span>AGENT ENGINEERING</span><span>知识 · 实践 · 情报</span></p>
      <h1 id="portal-title">学 Agent、<span class="agent-portal-keep">做项目</span>、<em>追前沿</em></h1>
      <p class="agent-portal-hero__lead">
        从底层原理、真实项目到每日技术情报，把分散的学习材料收束成一条可运行、可验证、可持续更新的工程路径。
      </p>
      <div class="agent-portal-actions">
        <a class="agent-portal-button agent-portal-button--primary" href="docs/navigation">
          开始学习 <span aria-hidden="true">→</span>
        </a>
        <a class="agent-portal-button agent-portal-button--secondary" href="capstone/">
          选择项目
        </a>
      </div>
    </div>
    <dl class="agent-portal-signal" aria-label="门户内容概览">
      <div><dt>21</dt><dd>章主课</dd></div>
      <div><dt>28</dt><dd>个项目</dd></div>
      <div><dt>DAILY</dt><dd>持续更新</dd></div>
    </dl>
  </section>

  <section class="agent-portal-section" aria-labelledby="portal-paths-title">
    <header class="agent-portal-section__heading">
      <div>
        <p class="agent-portal-kicker">从目标出发</p>
        <h2 id="portal-paths-title">今天，你想推进哪件事？</h2>
      </div>
      <p>不再从一百个链接里找入口。先选目标，再沿完整路径深入。</p>
    </header>
    <div class="agent-portal-pillars">
      <article class="agent-portal-pillar agent-portal-pillar--learn">
        <div class="agent-portal-pillar__number" aria-hidden="true">01</div>
        <p class="agent-portal-pillar__eyebrow">LEARN · 体系学习</p>
        <h3>从原理到生产，建立 Agent 工程能力</h3>
        <p>沿主课、基础扩展、RAG 与 LangGraph 专题逐层推进，每一站都有可运行代码。</p>
        <a href="docs/navigation">查看学习路线 <span aria-hidden="true">↗</span></a>
      </article>
      <article class="agent-portal-pillar agent-portal-pillar--build">
        <div class="agent-portal-pillar__number" aria-hidden="true">02</div>
        <p class="agent-portal-pillar__eyebrow">BUILD · 项目实践</p>
        <h3>用真实业务项目，把知识变成作品</h3>
        <p>从研究 Agent 到企业知识库，按场景选择可实现、可验收、可展示的项目。</p>
        <a href="capstone/">浏览 28 个项目 <span aria-hidden="true">↗</span></a>
      </article>
      <article class="agent-portal-pillar agent-portal-pillar--intel">
        <div class="agent-portal-pillar__number" aria-hidden="true">03</div>
        <p class="agent-portal-pillar__eyebrow">INTELLIGENCE · 前沿情报</p>
        <h3>过滤行业噪声，只追值得行动的变化</h3>
        <p>把每日资讯、技术长文和面试输入整理成可追溯、可复用的认知资产。</p>
        <a href="news/">进入情报中心 <span aria-hidden="true">↗</span></a>
      </article>
    </div>
  </section>

  <section class="agent-portal-section agent-portal-intelligence" aria-labelledby="portal-news-title">
    <header class="agent-portal-section__heading">
      <div>
        <p class="agent-portal-kicker">INTELLIGENCE FEED</p>
        <h2 id="portal-news-title">最新情报</h2>
      </div>
      <a class="agent-portal-text-link" href="news/">查看全部资讯 <span aria-hidden="true">→</span></a>
    </header>
    <div class="agent-portal-news" data-agent-portal-news data-news-state="fallback" aria-live="polite">
      <div class="agent-portal-news__fallback">
        <div>
          <p>查看今日情报</p>
          <span>实时列表加载后会显示在这里；完整资讯归档始终可以访问。</span>
        </div>
        <a href="news/">打开资讯归档</a>
      </div>
    </div>
  </section>

  <section class="agent-portal-section" aria-labelledby="portal-topics-title">
    <header class="agent-portal-section__heading">
      <div>
        <p class="agent-portal-kicker">TOPIC MAP</p>
        <h2 id="portal-topics-title">按关键能力深入</h2>
      </div>
      <p>把课程、专题和项目按能力重新组织，减少在目录之间来回跳转。</p>
    </header>
    <div class="agent-portal-topic-grid">
      <a href="agent-basics/"><span>01</span><strong>Agent 基础</strong><small>LLM、上下文、工具调用</small></a>
      <a href="lessons/04-the-agent-loop/"><span>02</span><strong>Agent 循环</strong><small>推理、行动、观察、记忆</small></a>
      <a href="rag-advanced/01-chunking-strategies/"><span>03</span><strong>RAG 与知识</strong><small>分块、检索、精排、评估</small></a>
      <a href="langgraph-advanced/"><span>04</span><strong>编排与多 Agent</strong><small>状态图、持久化、人机协同</small></a>
      <a href="lessons/15-evaluation-and-testing/"><span>05</span><strong>评估与安全</strong><small>测试、可观测、成本、护栏</small></a>
      <a href="lessons/18-deployment/"><span>06</span><strong>生产交付</strong><small>服务化、部署与运行边界</small></a>
    </div>
  </section>

  <section class="agent-portal-section agent-portal-source" aria-labelledby="portal-source-title">
    <div>
      <p class="agent-portal-kicker">SOURCE &amp; SYSTEM</p>
      <h2 id="portal-source-title">不只会用框架，也能读懂框架</h2>
      <p>从仓库地图进入 LangChain、LangGraph、LlamaIndex 等源码解析，再通过知识图谱理解概念之间的真实依赖。</p>
      <div class="agent-portal-source__actions">
        <a href="source-analysis/repository-matrix">打开源码地图 <span aria-hidden="true">→</span></a>
        <a href="docs/knowledge-graph">查看知识图谱</a>
      </div>
    </div>
    <div class="agent-portal-source__map" aria-hidden="true">
      <span>TOOLS</span><span>MEMORY</span><strong>AGENT</strong><span>RAG</span><span>EVAL</span>
    </div>
  </section>

  <footer class="agent-portal-footer">
    <p>一条路径，从第一个 LLM 调用走到可部署的 Agent 产品。</p>
    <a href="docs/setup">从环境搭建开始 <span aria-hidden="true">→</span></a>
  </footer>
</main>
