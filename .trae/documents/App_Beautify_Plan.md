# App 页面美化与交互优化计划 (App Beautify Plan)

## 1. 摘要 (Summary)
本项目旨在将 SuperMe App 的整体视觉风格统一为“极简现代” (Minimalist)，重点优化首页模块入口、数据列表页和表单弹窗的显示布局，并引入过渡动画、触觉反馈及手势操作等交互改善，全面提升用户体验。

## 2. 现状分析 (Current State Analysis)
- **视觉风格**：目前的基础组件（卡片、输入框等）依赖较硬的边框（border），背景色层级区分不够明显，整体偏向于基础的线框风格。
- **显示布局**：
  - **首页模块卡片**：采用左对齐，视觉重心偏上，略显单调。
  - **数据列表页**：列表项右侧直接平铺了“编辑”和“删除”图标按钮，占用空间，导致信息展示区域变小，视觉显拥挤。
  - **表单弹窗**：输入框带有黑色边框，较为生硬；模态框头部过于基础。
- **交互体验**：缺乏操作时的触觉反馈（Haptics），列表页没有手势滑动操作，且页面状态切换（如进入模块、显示搜索框）时没有平滑的过渡动画。

## 3. 拟定更改 (Proposed Changes)

### 3.1 全局样式升级 (Style Unification)
**文件**: `src/theme.ts`
- **颜色 (colors)**: 
  - 将应用背景 `bg` 调整为极浅灰 `#F9FAFB`。
  - 增加无边框输入框的软背景色 `surfaceMuted: '#F3F4F6'`。
  - 降低边框颜色的对比度，使其仅在必要时隐约可见。
- **圆角 (radius)**: 全局增加圆角大小（例如 `sm: 8, md: 12, lg: 16, xl: 24`），使组件更加圆润亲和。
- **阴影 (shadow)**: 调整阴影参数，使其更加柔和扩散，提升卡片悬浮感。

### 3.2 基础组件重构 (UI Components)
**文件**: `src/components/ui.tsx`
- **引入触觉反馈**: 导入 `expo-haptics`，在 `PrimaryButton`, `IconButton`, `SegmentedControl` 等组件的 `onPress` 事件中加入轻量级震动反馈 (`Haptics.impactAsync`)。
- **Card (卡片)**: 移除边框，完全依赖柔和的阴影和纯白背景。
- **Field (输入框)**: 移除硬边框，改用浅灰背景 (`surfaceMuted`)，增加内边距和圆角。
- **PrimaryButton (主按钮)**: 优化为大圆角，字体加粗，提升现代感。
- **SegmentedControl (分段控制器)**: 样式调整为类似 iOS 原生的胶囊药丸风格。

### 3.3 核心布局与手势优化 (Layout & Gestures)
**文件**: `src/features/CrudScreen.tsx`
- **引入动画**: 导入 `LayoutAnimation`，在模块切换 (`setActiveKey`)、数据加载完成等状态变更前调用 `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`，实现平滑过渡。
- **首页模块卡片 (Home Cards)**: 
  - 改为居中对齐布局。
  - 放大图标，为其增加柔和的圆形彩色背景。
  - 优化标题和副标题的间距与字体粗细。
- **数据列表页 (Data List)**:
  - 引入 `react-native-gesture-handler` 中的 `Swipeable` 组件。
  - 将原本常驻在右侧的“编辑”和“删除”按钮移至 Swipeable 的 `renderRightActions` 中，实现左滑显示操作菜单。
  - 清理默认状态下的列表项布局，使左侧图标/缩略图和右侧文本内容更加舒展。
- **表单弹窗 (EditModal)**:
  - 采用更大的顶部内边距和更干净的 Header 布局。
  - 配合更新后的无边框 `Field` 组件，使整个表单呈现出极简的“纸张”质感。

### 3.4 根布局支持 (Root Layout)
**文件**: `app/_layout.tsx`
- 在根组件最外层包裹 `<GestureHandlerRootView style={{ flex: 1 }}>`，确保 Android 和 iOS 端的手势滑动（如 Swipeable）能够完美生效。

## 4. 假设与决策 (Assumptions & Decisions)
- 假设已安装 `expo-haptics` 和 `react-native-gesture-handler`（已在 `package.json` 中确认）。
- 决定采用 `LayoutAnimation` 处理简单的视图进出场动画，因为它无需重写大量样式代码，且对 React Native 的标准布局变化支持极好。
- 极简风格意味着尽可能减少边框线（Borders），通过留白（Spacing）、背景色对比（Backgrounds）和柔和阴影（Shadows）来区分层级。

## 5. 验证步骤 (Verification Steps)
1. 启动应用预览。
2. 观察首页各个模块卡片的视觉效果，确认是否呈现出无边框、软阴影的现代感。
3. 点击按钮和切换 Tab 时，在真机上验证是否有轻微的触觉震动。
4. 进入任意模块（如“日常”），验证加载和切换过程是否有平滑的过渡动画。
5. 在数据列表中，向左滑动列表项，验证是否能正常划出“编辑”和“删除”按钮。
6. 点击新增/编辑，检查表单弹窗的输入框样式是否已更新为无边框浅色背景。
