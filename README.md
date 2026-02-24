# Auto-Drive-Viz

Auto-Drive-Viz 是一个基于 Web 的自动驾驶数据可视化平台，旨在直观地展示和分析自动驾驶相关的传感器数据。

本项目采用前后端分离的架构：
*   **前端 (Client)**: 位于 `apps/client` 目录，使用 **Vite + React + TypeScript** 构建，负责 3D 场景渲染、交互界面和数据展示。
*   **后端 (Server)**: 位于 `apps/server` 目录，使用 **NestJS** 框架，负责提供数据接口、处理传感器数据（如 LiDAR 点云、图像、标注数据等）。

## 项目结构

```
auto-drive-viz/
├── apps/
│   ├── client/       # 前端项目 (React + Vite)
│   │   ├── src/
│   │   │   ├── components/  # 可视化组件 (PointCloudViewer, CameraWall 等)
│   │   │   ├── types/       # 类型定义
│   │   │   └── ...
│   │   ├── ...
│   │   └── README.md # 前端详细文档
│   │
│   └── server/       # 后端项目 (NestJS)
│       ├── src/      # 后端源码
│       ├── data/     # 数据目录 (KITTI 数据集等)
│       ├── ...
│       └── README.md # 后端详细文档
│
├── README.md         # 项目总文档 (本文件)
└── ...
```

## 快速开始

你需要分别启动后端服务和前端应用。

### 1. 启动后端 (Server)

确保你已经进入 `apps/server` 目录并安装了依赖。

```bash
cd apps/server
npm install
npm run start:dev
```

后端服务默认运行在 `http://localhost:3000`。

### 2. 启动前端 (Client)

确保你已经进入 `apps/client` 目录并安装了依赖。

```bash
cd apps/client
npm install
npm run dev
```

前端应用通常运行在 `http://localhost:5173` (具体端口请查看终端输出)。

## 功能特性

*   **多视图支持**: 支持透视视图 (Perspective) 和鸟瞰视图 (BEV) 切换。
*   **多模态数据展示**:
    *   **LiDAR 点云**: 实时渲染 3D 点云数据，支持基于强度的伪彩色渲染。
    *   **相机图像**: 展示环视相机采集的图像数据。
    *   **3D 目标检测**: 可视化 3D 边界框 (Bounding Boxes)，支持车辆、行人等分类。
    *   **自身状态 (Ego State)**: 显示车辆的速度、航向角、加速度、角速度等信息。
*   **交互控制**: 支持播放/暂停、帧跳转、点云大小调节等。
*   **性能优化**:
    *   使用 Web Workers 异步解析点云数据。
    *   使用 AbortController 取消过期请求。
    *   基于 BufferGeometry 的高效渲染。

## 数据准备

本项目默认配置为读取 KITTI 数据集格式。请确保将相应的数据文件放置在 `apps/client/public/data/kitti` 目录下（或配置后端读取路径），以便系统能够正确加载。

## 许可证

[MIT License](LICENSE)
