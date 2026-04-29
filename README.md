# SuperMe-APP

SuperMe-APP 是一个基于 Expo、React Native 和 Expo Router 的个人数字终端应用，覆盖日常记录、财务管理和系统设置三类核心能力。

当前主要功能包括：

- 登录认证与 token 持久化
- 日常记录：待办、心情、随手记、工作日志、课堂日志、愿望、足迹、阅读
- 财务管理：账单、订阅、归物资产、报表、收入分析
- 设置管理：财务分类树、收入分类、笔记标签、课堂类型等配置

## 技术栈

- Expo `~54.0.33`
- React `19.1.0`
- React Native `0.81.5`
- Expo Router `~6.0.23`
- TypeScript `~5.9.2`
- `@gorhom/bottom-sheet`
- `expo-secure-store`
- `expo-image-picker`
- `expo-linear-gradient`
- `react-native-chart-kit`

## 启动方式

```bash
npm install
npm run start
npm run lint
```

默认 API 地址：

- `https://superme.qiuzizhao.com/api`
- 可通过 `EXPO_PUBLIC_API_URL` 覆盖
- 示例见 [.env.example](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/.env.example)

## 路由结构

`app/` 只负责 Expo Router 路由和布局，不承载复杂业务逻辑：

```text
app/
├── _layout.tsx
├── index.tsx
├── login.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── daily.tsx
    ├── finance.tsx
    └── settings.tsx
```

说明：

- [app/_layout.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/app/_layout.tsx) 负责全局 Provider、手势、Bottom Sheet 容器和导航栈
- [app/index.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/app/index.tsx) 根据登录状态重定向到登录页或日常页
- [app/(tabs)/_layout.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/app/(tabs)/_layout.tsx) 定义底部 Tab，并做二次鉴权保护

## 当前目录结构

重构后的核心代码集中在 `src/`，结构已经从“大文件聚合”调整为“按业务域切片”：

```text
src/
├── auth/
│   ├── AuthContext.tsx
│   └── tokenStorage.ts
├── shared/
│   ├── api/
│   ├── components/
│   ├── theme/
│   └── utils/
├── features/
│   ├── crud/
│   ├── daily/
│   │   ├── _shared/
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
│   │   ├── shared/
│   │   ├── FinanceDashboard.tsx
│   │   ├── moduleConfig.ts
│   │   └── styles.ts
│   ├── modules/
│   └── settings/
├── components/
├── lib/
├── theme.ts
└── utils/
```

兼容层仍然保留在这些旧入口文件中，便于逐步迁移 import：

- [src/features/CrudScreen.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/CrudScreen.tsx)
- [src/features/TodoScreen.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/TodoScreen.tsx)
- [src/features/FinanceDashboard.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/FinanceDashboard.tsx)
- [src/features/SettingsScreen.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/SettingsScreen.tsx)
- [src/features/ReplicatedScreens.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/ReplicatedScreens.tsx)
- [src/features/moduleConfig.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/moduleConfig.ts)
- [src/components/ui.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/components/ui.tsx)

## 核心模块说明

### 认证与 API

- [src/auth/AuthContext.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/auth/AuthContext.tsx)：登录状态、初始化、login/logout、401 处理
- [src/auth/tokenStorage.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/auth/tokenStorage.ts)：Web/localStorage 与原生/SecureStore 兼容存储
- [src/shared/api/index.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/shared/api/index.ts)：统一 `apiRequest`、`uploadImage`、`buildAssetUrl`

### 模块配置

- [src/features/modules/dailyModules.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/modules/dailyModules.ts)：日常模块配置
- [src/features/modules/financeModules.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/modules/financeModules.ts)：财务模块配置
- [src/features/modules/moduleConfig.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/modules/moduleConfig.ts)：统一导出

### 通用 CRUD 基座

- [src/features/crud/CrudScreen.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/crud/CrudScreen.tsx)：模块入口与 CRUD 页面容器
- [src/features/crud/api.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/crud/api.ts)：通用 CRUD 接口封装
- [src/features/crud/components](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/crud/components)：模块网格、记录列表、编辑弹层

### 日常模块

- `todos`：完整拆分为 `screen / api / types / utils / components`
- `moods`、`notes`、`worklogs`、`teachings`、`wishlists`、`footprints`、`readings`：按模块目录拆分，并共用 `daily/_shared`

### 财务模块

- `records`：账单录入、编辑、删除、账本分类选择
- `reports`：报表分析、日历视图、周期选择、环图/面积图
- `income-analysis`：收入统计、分类预估、趋势图
- `subscriptions`：周期订阅管理
- `assets`：归物资产管理

### 设置模块

- [src/features/settings/SettingsScreen.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/settings/SettingsScreen.tsx)：组合设置页
- [src/features/settings/api.ts](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/settings/api.ts)：设置相关接口
- [src/features/settings/components](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/features/settings/components)：账户卡片、分类树、标签编辑等局部组件

## 当前模块化约定

复杂业务模块优先采用下面的目录约定：

```text
module-name/
├── index.ts
├── ModuleScreen.tsx
├── api.ts
├── types.ts
├── utils.ts
├── hooks.ts        # 按需添加
├── styles.ts       # 按需添加
└── components/
```

当前约定已经基本落地：

- 页面层尽量只做状态编排和组件组合
- endpoint 字符串集中在模块 `api.ts` 或模块配置里
- 复杂 UI 被拆到 `components/`
- 数据转换逻辑被移到 `utils.ts`

## 开发提示

- 新增简单业务模块时，优先参考 `crud/` 基座和 `features/modules/*Modules.ts`
- 新增复杂业务模块时，优先参考 `daily/todos/`、`finance/records/`、`finance/reports/`、`settings/`
- 如果修改共享 UI，优先落在 [src/shared/components/index.tsx](/Users/qiuzizhao/Documents/Projects/SuperMe-APP/src/shared/components/index.tsx)
