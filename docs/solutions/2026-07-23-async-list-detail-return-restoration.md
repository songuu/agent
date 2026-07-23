---
title: "异步列表返回后精确定位点击文章"
date: 2026-07-23
tags: [solution, frontend, navigation, scroll-restoration]
related_instincts: []
aliases: ["列表详情返回定位", "异步列表滚动恢复"]
---

# 异步列表返回后精确定位点击文章

## Problem

从列表进入详情后再返回，URL 中的筛选和页码能够恢复，但列表请求尚未完成时目标卡片不存在，页面会提前恢复到旧的绝对滚动值，无法直接定位到刚才点击的文章。

## Root Cause

旧逻辑只在恢复函数调用当下查询一次目标节点；查询不到时仍安排滚动并删除 `sessionStorage` 记录。异步请求完成后虽然文章卡片出现，恢复信息已经被消费。

## Solution

1. 在列表 loading DOM 挂载后、发起请求前调用 `restoreListDetailPosition(root)`。
2. 先对列表根节点建立 `MutationObserver`，再查询目标，消除“查询与监听之间插入”的竞态。
3. 目标不存在时不滚动、不删除恢复记录；无关 DOM mutation 也不触发恢复。
4. 目标出现后等待两帧布局，并按业务 `itemKey` 重新查询当前节点，避免使用已被 `replaceChildren()` 替换的旧引用。
5. 用目标当前坐标与点击时保存的 `anchorViewportTop` 计算滚动值，成功滚动后才消费记录。
6. observer 以 60 秒为边界；成功、路由变化或超时都清理监听和定时器，超时不消费记录。

```ts
observer.observe(root, { childList: true, subtree: true });
ensureWaitTimeout();

if (findAnchor()) {
  afterNextLayout(() => {
    const currentAnchor = findAnchor();
    if (!currentAnchor) return;
    window.scrollTo({ top: resolveListDetailScrollTop(position, window.scrollY, currentAnchor.getBoundingClientRect().top) });
    removeStoredReturnPosition(storageKey);
    stopWaiting();
  });
}
```

## Verification

- 相关测试：`50/50` 通过；异步回归测试覆盖“无关 mutation 不消费记录”和“目标出现后按新几何位置计算”。
- `pnpm typecheck`：通过。
- 本地真实异步题库（625 条）回放：返回时先进入 loading；数据渲染后同一文章点击前后 `top` 都是 `202.1875`，偏差 `0px`。
- VitePress 构建未形成通过证据：一次在渲染阶段以 Windows 原生退出码 `3221226505` 中止，重试一次在渲染阶段超时。

## Prevention

