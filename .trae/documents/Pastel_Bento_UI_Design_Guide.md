# 🎨 SuperMe APP - 马卡龙便当盒 (Pastel Bento) 主题设计规范

本文档记录了 SuperMe APP 本次全面重构所采用的 **“马卡龙便当盒 (Pastel Bento)”** 核心 UI 交互与视觉规范，作为后续持续维护与开发的美化基准。

## 1. 核心设计理念 (Core Concept)

### 1.1. Bento Grid (便当盒布局)
- **打破传统网格**: 告别生硬死板的均分两列。
- **模块主次分明**: 核心模块（如待办、账单等）横跨两列 `width: '100%', aspectRatio: 2.1`，辅助功能模块（如习惯、足迹）保持正方形小方块 `width: '47.5%', aspectRatio: 1.05`。
- **圆润无界**: 卡片采用大圆角 (`borderRadius: 24`)，配以极轻薄的微阴影（`shadow` / `elevation: 8`）和 3% 极浅边框 (`borderColor: 'rgba(0,0,0,0.03)'`)。

### 1.2. Pastel Colors (低饱和马卡龙色系)
- **拒绝大面积纯白**: 为每张模块卡片引入随主题色自动生成的渐变背景。
- **物理隐喻**: 当模块包含重要状态（例如：待办中剩余几项、心情等），直接将数据融入卡片底色中。

### 1.3. 情感化与温度 (Emotional Design)
- **动态问候语 (Hero Section)**: 取消冷冰冰的“日常”标题，替换为基于时间切换的问候语：
  - 🌅 清晨：“早安，又是充满希望的一天”
  - ☕️ 下午：“下午好，记得喝杯水休息一下”
  - 🌙 夜晚：“夜深了，放松心情早点休息吧”
- **Spring Animation (弹簧动效)**: 所有可点击的卡片和按钮均加入了物理按压回弹效果：`transform: [{ scale: 0.98 }]`。

---

## 2. 交互模式重构 (Interaction Patterns)

### 2.1. 全局浮动操作按钮 (Floating Action Button - FAB)
- **位置统一**: 所有模块的新建/录入入口，统一移除原本占据头部空间的 `PrimaryButton` 长条，全部收敛为悬浮于右下角 (`bottom: 32, right: 24, zIndex: 100`) 的圆形大按钮。
- **专属渐变主题**: 针对 8 大模块，每个模块的 FAB 都匹配了专属情绪的马卡龙渐变色：
  - 💜 心情：`['#A855F7', '#7E22CE']`
  - 📘 随手记：`['#3B82F6', '#2563EB']`
  - 💼 工作日志：`['#0EA5E9', '#1D4ED8']`
  - 👩‍🏫 课堂日志：`['#10B981', '#047857']`
  - 💳 订阅：`['#F43F5E', '#BE123C']`
  - 📦 归物：`['#F59E0B', '#D97706']`
  - 👣 足迹：`['#10B981', '#047857']`
  - 📚 阅读：`['#8B5CF6', '#4338CA']`
  - 🌸 愿望单：`['#EC4899', '#B45309']`

### 2.2. 丝滑底部抽屉 (Bottom Sheet)
全面弃用原生的全屏 `Modal`，引入 `@gorhom/bottom-sheet`。
- **呼出方式**: 点击右下角 FAB 或长按列表项进行编辑时呼出。
- **视觉层级**:
  - `snapPoints: ['85%']`，配合深色遮罩（`opacity: 0.4`）。
  - **背景与拉手**: `backgroundColor: colors.surface` (纯白/纯黑)、拉手加粗为胶囊状 (`width: 48, height: 6, borderRadius: 3`)。
- **表单体验优化**: 
  - 输入框（Field）取消死板描边，统一采用 `backgroundColor: colors.surfaceMuted` 的无边框大圆角胶囊 (`borderRadius: radius.xl`)，呈现出内凹的“便当盒”块状质感。
  - 底部操作栏（Actions）：强引导！“保存/添加”按钮设置为 `flex: 1` 自适应拉长，“取消/删除”收缩在左侧。

---

## 3. 专属页面的极致美化

### 3.1. 财务面板 (FinanceDashboard)
- **资产虚拟卡片**: 顶部的总金额不再是普通文本，而是一张极具现代感的“信用卡”，支持通过 `expo-linear-gradient` 实现深邃沉浸式的背景，包含“卡号”隐喻与渐变发光。
- **图表增强**: `react-native-chart-kit` 折线图开启 `fillShadowGradient` 与平滑贝塞尔曲线，数据呈现更丰满。
- **时间轴流水**: 账单列表左侧增加时间轴引线；类目图标（餐饮、交通等）采用 Emoji 结合彩色底圈。

### 3.2. 待办日历视图 (Calendar View)
- 日历方块不仅能显示日期，还能直接打点（Dots）显示当天挂载的待办事项颜色（如生活类为绿色，工作类为蓝色），未完成/已完成的状态直观可辨。

---

## 4. 技术栈支持
实现该主题依赖了以下外部库：
1. `expo-linear-gradient`：用于生成极其细腻的按钮和卡片背景过渡。
2. `@gorhom/bottom-sheet`：提供丝滑的 60fps 底部物理回弹抽屉。
3. `react-native-reanimated`：配合 Bottom Sheet 的底层动画驱动。
4. `expo-haptics`：在点击按钮时提供细腻的震动反馈（Taptic Engine）。