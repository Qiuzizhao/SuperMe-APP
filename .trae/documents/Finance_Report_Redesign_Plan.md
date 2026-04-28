# 财务报表页面重构方案 (Finance Report Redesign Plan) - 收尾阶段

## 1. 摘要 (Summary)
基于 `Pastel Bento UI Design Guide`，对 `src/features/FinanceDashboard.tsx` 页面进行重构的最后收尾工作。目前页面已基本完成卡片化（Bento Grid）与 `BottomSheetModal` 的改造，但仍遗留了部分未完成的弹簧动效（Spring Animation）以及大量冗余的旧版样式代码（甚至包含了对已删除的 `xqColors` 引用，可能导致运行时报错）。本方案旨在完成最后的清理与体验优化。

## 2. 现状分析 (Current State Analysis)
- **弹簧动效缺失**：虽然 `styles.pressed` 已定义并在部分卡片上应用，但仍有多个核心的可交互元素（如 `billCard`、右下角 `fab` 悬浮按钮、图表切换按钮、收入分析过滤按钮等）未使用物理按压动效。
- **废弃样式遗留**：`StyleSheet.create` 中残留了大量以 `xq` 开头的未使用样式（如 `xqBreakdownList`, `xqCalendarTabs`, `xqProgressFill` 等）。其中部分样式还引用了已被移除的变量 `xqColors`，如果不加清理，极易引发 `ReferenceError: xqColors is not defined`。
- **命名不统一**：环形图和面积图相关的少量在用样式仍保留着旧版的 `xq` 前缀（如 `xqDonutStage`），需要统一重命名以保证代码整洁。

## 3. 改造方案 (Proposed Changes)

### 3.1 补充弹簧按压动效 (Spring Animation)
涉及文件：`src/features/FinanceDashboard.tsx`
在以下 `Pressable` 组件中，将原有的普通 `style={...}` 替换为支持动效的 `style={({ pressed }) => [..., pressed && styles.pressed]}`：
- 账单列表项 (`billCard`)
- 悬浮操作按钮 (`fab`)
- 胶囊分类标签 (`financePill`)
- 结构分析区域的层级切换与图表类型切换按钮
- 环形图中心区域 (`xqDonutCenter` -> `donutCenter`)
- 收入分析模块中的分类过滤按钮 (`chartFilterBtn`)

### 3.2 冗余样式代码清理与重命名
涉及文件：`src/features/FinanceDashboard.tsx`
- **深度清理**：在 `StyleSheet.create` 中，删除所有不再被组件引用的 `xq` 前缀样式，彻底消灭 `xqColors` 的幽灵引用。
- **规范重命名**：将仍在使用的 `xq` 样式统一重命名为标准小驼峰命名（例如：`xqDonutStage` 变更为 `donutStage`，`xqTreemapTile` 变更为 `treemapTile` 等），并在对应的 JSX 节点中同步更新引用，使样式命名完全融入当前体系。

## 4. 假设与决策 (Assumptions & Decisions)
- 日历视图（Calendar View）中的天数方块目前仅作展示用途，并未绑定点击事件，因此无需为其添加按压动效。
- 由于 `xqColors` 已在之前的重构中移除，当前包含 `xqColors` 的所有样式均属于可安全删除的“死代码”，直接移除不会对现有布局产生负面影响。

## 5. 验证步骤 (Verification Steps)
1. **代码检查**：全局搜索 `FinanceDashboard.tsx`，确认文件内已不存在 `xqColors` 或 `xq` 开头的残留字符，确保彻底清理。
2. **动效验证**：在应用中点击“账单列表”、“右下角添加按钮”以及“图表切换”，检查是否均具备丝滑的缩放回弹 (`scale: 0.98`) 反馈。
3. **渲染验证**：重新加载应用，检查环形图（Donut）和面积图（Treemap）是否正常渲染且无样式错乱。