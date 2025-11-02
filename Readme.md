# 📸 智能图片压缩工具

一个现代化、功能强大的在线图片压缩工具，支持批量处理，帮助您快速减小图片文件大小或调整图片尺寸，同时保持高质量。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg)

## ✨ 核心功能

### 🎯 三种压缩模式

#### 1. 📏 文件大小模式

- 设置目标文件大小（支持 B、KB、MB、GB 单位）
- 智能质量推荐：根据目标文件大小自动推荐最佳压缩质量
- 实时质量调整，平衡文件大小和图片质量

#### 2. 🖼️ 像素尺寸模式

- **双输入控制**：分别设置宽度和高度（像素）
- **两种比例模式**：
  - **固定比例模式**：保持原始宽高比，按最大尺寸缩放
  - **自由比例模式**：允许拉伸变形到指定宽高（可能扭曲）
- **无损尺寸调整**：只调整图片尺寸，不进行质量压缩
- 支持保持原始分辨率选项

#### 3. 🎨 质量模式

- 直接设置压缩质量参数（0.1-1.0）
- 实时显示预计文件大小和压缩率
- 支持自定义初始质量

### 🚀 高性能处理

- **Web Worker 后台处理**：所有压缩操作在 Web Worker 中执行，不阻塞主线程
- **批量处理**：支持一次处理多张图片
- **实时进度反馈**：显示每个文件的处理进度和总体进度
- **队列管理**：
  - 自动分离待处理和已处理队列
  - 支持在压缩过程中继续添加新文件
  - 不会重复处理已完成的文件

### 📊 直观的用户界面

- **分离的队列显示**：
  - 待处理队列：显示等待处理和正在处理的文件
  - 已处理队列：显示已完成和失败的文件
  - 空状态插画：队列为空时显示友好提示
- **响应式布局**：
  - 宽屏：两个队列并排显示（flex-row）
  - 窄屏：两个队列上下堆叠（flex-col）
- **文件预览**：每个文件显示缩略图预览
- **实时统计**：显示文件数量、压缩比例、处理状态
- **自定义滚动**：隐藏滚动条，保持界面美观

### ⚙️ 灵活的配置选项

- **输出格式**：支持 JPEG、PNG、WebP
- **文件大小单位**：自动、B、KB、MB、GB 可选
- **后台处理开关**：控制是否使用 Web Worker
- **保持原始分辨率**：可选择忽略尺寸设置，只压缩文件大小

### 🔒 隐私安全

- **完全本地处理**：所有操作在浏览器本地完成
- **无服务器上传**：图片不会上传到任何服务器
- **离线可用**：构建后可完全离线使用

## 🛠️ 技术栈

### 核心框架

- **React 19.1** - 现代化的 UI 框架
- **TypeScript 5.9** - 类型安全的开发体验
- **Vite 7.1 (Rolldown)** - 极速的构建工具

### UI 与样式

- **Tailwind CSS 4.1** - 实用优先的 CSS 框架
- **Radix UI** - 无样式、可访问的 UI 组件
  - `@radix-ui/react-label` - 表单标签
  - `@radix-ui/react-progress` - 进度条
  - `@radix-ui/react-switch` - 开关组件
  - `@radix-ui/react-slot` - 组件插槽
  - `@radix-ui/react-dialog` - 对话框
  - `@radix-ui/react-toast` - 提示通知
  - `@radix-ui/react-tooltip` - 工具提示
- **Lucide React 0.548** - 精美的图标库

### 工具库

- **browser-image-compression 2.0.2** - 图片压缩核心库
- **class-variance-authority 0.7.1** - 类名变体管理
- **clsx 2.1.1** - 条件类名工具
- **tailwind-merge 3.3.1** - Tailwind 类名合并

### 开发工具

- **ESLint 9.36** - 代码质量检查
- **TypeScript ESLint 8.45** - TypeScript 代码规范
- **@vitejs/plugin-react 5.0** - React 插件

## 📁 项目结构

```
any-size-photo/
├── src/
│   ├── components/              # React 组件
│   │   ├── CompressionConfig.tsx    # 压缩配置组件（支持三种模式）
│   │   ├── FileUpload.tsx           # 文件上传组件（拖拽+点击）
│   │   ├── ProgressDisplay.tsx      # 进度显示组件
│   │   ├── Intro.tsx                # 介绍组件
│   │   └── ui/                      # UI 基础组件
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── switch.tsx
│   │       ├── progress.tsx
│   │       ├── badge.tsx
│   │       └── card.tsx
│   ├── hooks/
│   │   └── useImageCompression.ts   # 图片压缩核心 Hook
│   │       - 文件队列管理
│   │       - Web Worker 通信
│   │       - 状态管理
│   ├── workers/
│   │   └── imageCompression.worker.ts  # Web Worker
│   │       - 图片压缩处理
│   │       - 像素尺寸调整
│   │       - 进度回调
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   ├── lib/
│   │   └── utils.ts               # 工具函数（文件大小格式化等）
│   ├── App.tsx                    # 主应用组件
│   └── main.tsx                   # 应用入口
├── public/                        # 静态资源
├── dist/                          # 构建输出
├── package.json                   # 项目配置
├── vite.config.ts                 # Vite 配置
├── tailwind.config.js             # Tailwind 配置
└── tsconfig.json                  # TypeScript 配置
```

## 🚀 快速开始

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
pnpm preview
```

## 📖 使用说明

### 1. 上传图片

- **拖拽上传**：将图片文件拖拽到上传区域
- **点击选择**：点击上传区域选择文件
- **批量上传**：支持一次选择多个图片文件

### 2. 选择压缩模式

#### 📏 文件大小模式

1. 选择目标文件大小单位（B/KB/MB/GB）
2. 输入目标文件大小
3. 系统自动推荐并设置最佳压缩质量

#### 🖼️ 像素尺寸模式

1. 选择是否保持原始比例
   - **开启**：图片保持原始宽高比，不会扭曲
   - **关闭**：图片会被拉伸到指定宽高（可能扭曲）
2. 分别设置目标宽度和高度（像素）
3. 图片将只调整尺寸，不进行质量压缩

#### 🎨 质量模式

1. 设置压缩质量（0.1-1.0）
2. 查看预计文件大小和压缩率
3. 可同时设置初始质量

### 3. 通用设置

- **输出格式**：选择 JPEG、PNG 或 WebP
- **后台处理**：启用 Web Worker（推荐开启）
- **保持原始分辨率**：启用后忽略尺寸设置，只压缩文件大小

### 4. 开始处理

点击"开始压缩"按钮，系统将按顺序处理所有待处理的图片。

### 5. 查看结果

- **待处理队列**：显示等待处理和正在处理的图片
- **已处理队列**：显示已完成和失败的图片
- 可以单独下载每个处理后的图片，或批量下载所有完成的图片

## 🎯 核心功能实现

### 队列管理系统

- **自动分离**：根据文件状态自动分配到待处理和已处理队列
- **状态追踪**：pending → processing → completed/error
- **智能处理**：只处理待处理队列中的文件，不会重复处理已完成文件

### Web Worker 处理机制

- **后台执行**：所有图片处理在 Web Worker 中完成
- **非阻塞**：主线程保持流畅，界面不卡顿
- **进度反馈**：实时传递处理进度到主线程
- **错误处理**：完善的错误捕获和反馈机制

### 像素尺寸处理逻辑

- **固定比例模式**：
  - 计算原始宽高比
  - 根据目标尺寸计算最佳缩放比例
  - 保持原始比例调整尺寸
- **自由比例模式**：
  - 使用 Canvas 直接调整到目标宽高
  - 可能造成图片扭曲
  - 质量设为 1，不进行压缩

### 智能质量推荐

- 根据目标文件大小自动计算推荐质量
- 大文件（≥2MB）→ 高质量（0.9）
- 中等文件（≥1MB）→ 中等质量（0.8）
- 小文件（≥0.5MB）→ 低质量（0.7）
- 极小文件（<0.5MB）→ 更低质量（0.6）

## 🔧 技术特性

- ✅ **TypeScript 全类型支持**：完整的类型定义，提供优秀的开发体验
- ✅ **响应式设计**：适配桌面端和移动端
- ✅ **现代化 UI**：使用 Tailwind CSS 和 Radix UI 构建美观界面
- ✅ **性能优化**：Web Worker 处理，不阻塞主线程
- ✅ **用户体验优化**：隐藏滚动条、平滑动画、实时反馈
- ✅ **代码规范**：ESLint + TypeScript 保证代码质量

## 📝 开发计划

- [ ] 支持更多图片格式（GIF、TIFF 等）
- [ ] 添加图片编辑功能（裁剪、旋转等）
- [ ] 支持图片格式转换
- [ ] 添加历史记录功能
- [ ] 支持保存压缩配置
- [ ] 添加暗色模式
- [ ] 支持批量下载 ZIP 压缩包

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) - 图片压缩核心库
- [Radix UI](https://www.radix-ui.com/) - 优秀的 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide Icons](https://lucide.dev/) - 精美的图标库
- [Vite](https://vite.dev/) - 下一代前端构建工具

---

Made with ❤️ using React + TypeScript + Vite
