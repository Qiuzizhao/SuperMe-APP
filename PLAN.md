# SuperMe-APP 模块化重构计划说明文档

## Summary

本计划目标是将当前 `src/features` 下的大文件重构为更适合阅读、协作和 vibe coding 的模块化结构。重构原则是 **不改变业务行为，先拆结构，再抽逻辑，最后优化边界**。

当前重点问题：

- `FinanceDashboard.tsx`、`ReplicatedScreens.tsx`、`SettingsScreen.tsx`、`TodoScreen.tsx` 文件过大。
- 页面、API、状态、表单、工具函数、局部组件和样式混在同一文件中。
- 多人协作时容易产生冲突，AI 辅助编码时上下文过大。
- 新增功能时缺少稳定的模块模板。

推荐采用 **Feature-Sliced + 局部组件化** 方案：按业务域拆分目录，每个模块内部统一拆为 `screen / components / hooks / api / types / utils / styles`。

## Key Changes

### 1. 调整源码组织结构

目标结构：

```text
src/
├── auth/
├── shared/
│   ├── api/
│   ├── components/
│   ├── theme/
│   └── utils/
├── features/
│   ├── crud/
│   ├── daily/
│   │   ├── todos/
│   │   ├── moods/
│   │   ├── notes/
│   │   ├── worklogs/
│   │   ├── teachings/
│   │   ├── wishlists/
│   │   ├── footprints/
│   │   ├── readings/
│   │   └── moduleConfig.ts
│   ├── finance/
│   │   ├── records/
│   │   ├── reports/
│   │   ├── income-analysis/
│   │   ├── subscriptions/
│   │   ├── assets/
│   │   └── moduleConfig.ts
│   └── settings/
```

每个业务模块采用统一内部结构：

```text
module-name/
├── index.ts
├── ModuleScreen.tsx
├── api.ts
├── types.ts
├── hooks.ts
├── utils.ts
├── styles.ts
└── components/
```

### 2. 第一阶段：无行为变化拆文件

先做纯结构迁移，不改交互、不改接口、不改 UI 行为。

优先拆 `ReplicatedScreens.tsx`：

```text
src/features/daily/moods/
src/features/daily/notes/
src/features/daily/worklogs/
src/features/daily/teachings/
src/features/daily/wishlists/
src/features/daily/footprints/
src/features/daily/readings/
src/features/finance/subscriptions/
src/features/finance/assets/
```

拆分后由 barrel 文件统一导出，保证现有路由层 import 改动最小。

### 3. 第二阶段：拆 `TodoScreen`

将 `TodoScreen.tsx` 拆为：

```text
src/features/daily/todos/
├── TodoScreen.tsx
├── types.ts
├── hooks.ts
├── utils.ts
├── styles.ts
└── components/
    ├── TodoCard.tsx
    ├── TodoCalendar.tsx
    └── TodoEditorSheet.tsx
```

页面组件只负责组合 UI；待办加载、创建、更新、删除逻辑放入 `useTodos`；日期计算与日历生成放入 `utils.ts`。

### 4. 第三阶段：拆 `FinanceDashboard`

将财务模块拆为：

```text
src/features/finance/
├── FinanceDashboard.tsx
├── moduleConfig.ts
├── shared/
│   ├── types.ts
│   └── utils.ts
├── records/
│   ├── FinanceRecordsScreen.tsx
│   ├── api.ts
│   ├── hooks.ts
│   └── components/
├── reports/
│   ├── FinanceReportScreen.tsx
│   ├── FinanceReport.tsx
│   └── components/
└── income-analysis/
    ├── IncomeAnalysis.tsx
    ├── hooks.ts
    └── components/
```

财务金额格式化、日期区间、分类聚合、图表数据转换等纯函数进入 `finance/shared/utils.ts`。

### 5. 第四阶段：拆共享 UI

将 `src/components/ui.tsx` 拆到 `src/shared/components/`：

```text
src/shared/components/
├── layout/
│   ├── Screen.tsx
│   └── Header.tsx
├── buttons/
│   ├── PrimaryButton.tsx
│   └── IconButton.tsx
├── form/
│   ├── Field.tsx
│   ├── DateField.tsx
│   └── SegmentedControl.tsx
└── feedback/
    └── StateView.tsx
```

保留 `src/shared/components/index.ts` 统一导出，减少调用方 import 成本。

### 6. 第五阶段：API 与类型收敛

将散落在页面中的 `apiRequest(...)` 收敛为模块 API 文件，例如：

```ts
export function listTodos(...)
export function createTodo(...)
export function updateTodo(...)
export function deleteTodo(...)
```

页面层不直接写 endpoint 字符串，只调用模块 API 或 hooks。

## Public Interfaces / Types

重构不改变后端接口、不改变路由 URL、不改变现有页面功能。

新增或调整的内部接口：

- 每个模块增加 `types.ts`，导出当前模块的数据类型。
- 每个模块增加 `api.ts`，封装当前模块的 REST 调用。
- 每个复杂模块增加 `hooks.ts`，封装加载、刷新、保存、删除等状态流。
- `moduleConfig.ts` 后续拆成 daily 与 finance 两份配置，并通过 `index.ts` 统一导出。
- `src/components/ui.tsx` 将迁移为 `src/shared/components/index.ts`，旧 import 可短期保留兼容层。

## Test Plan

每个阶段完成后执行：

```bash
npm run lint
```

人工验收重点：

- 登录后仍能正常进入日常、财务、设置 Tab。
- 日常模块列表可进入各子模块。
- 待办可新增、编辑、完成、删除，日历视图正常。
- 心情、笔记、日志、课堂、愿望、足迹、阅读页面行为保持不变。
- 财务账单可新增、编辑、删除，收入/支出切换正常。
- 财务报表和收入分析图表正常渲染。
- 设置页分类树和配置保存正常。
- 图片选择、上传和展示路径仍正常。
- 未登录访问 Tab 仍会跳转登录页。

结构验收标准：

- 单个业务文件尽量控制在 300 行以内，复杂 Screen 最多不超过 500 行。
- 页面文件不直接堆大量数据转换逻辑。
- endpoint 字符串集中在模块 `api.ts` 或配置文件。
- `ReplicatedScreens.tsx` 最终删除或仅作为临时兼容导出文件。
- 新增模块可以复制现有模块结构快速开始。

## Assumptions

- 本轮重构以代码结构优化为目标，不进行 UI 改版。
- 不改变后端接口、不调整数据结构、不新增状态管理库。
- 暂时继续使用当前 `StyleSheet` 方案，不引入 NativeWind、Tamagui 等新样式体系。
- 不引入 Redux、Zustand、React Query；模块 hooks 先基于现有 React state 和 `apiRequest` 实现。
- 允许保留短期兼容导出文件，降低一次性迁移风险。
- 推荐按阶段提交，每阶段保持可运行、可回滚。
