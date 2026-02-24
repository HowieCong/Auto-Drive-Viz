# Auto-Drive-Viz 前端

前端应用基于 **React 18**、**TypeScript** 和 **Vite** 构建，专注于高性能的自动驾驶数据 3D 可视化。

## 核心技术栈

-   **React 18**: UI 框架
-   **Three.js / React Three Fiber**: 3D 场景渲染
-   **Leva**: 调试与控制面板
-   **Vite**: 极速开发与构建工具

## 主要功能

1.  **3D 点云可视化**:
    -   使用 `PointCloudViewer` 组件渲染大规模 LiDAR 点云。
    -   支持基于反射强度的颜色映射 (Intensity Colormap)。
    -   **性能优化**: 点云解析逻辑移至 Web Worker (`src/utils/pointCloudWorker.ts`)，避免阻塞主线程。

2.  **3D 边界框 (Bounding Boxes)**:
    -   使用 `BoundingBox3DVisualizer` 组件绘制 3D 检测框。
    -   支持不同类别的颜色区分（如汽车为绿色，行人红色）。
    -   显示物体朝向。

3.  **多视图切换**:
    -   支持透视投影 (Perspective) 和正交投影 (Orthographic/BEV) 切换。

4.  **仪表盘 (Cockpit Panel)**:
    -   实时显示车辆遥测数据：速度、加速度、角速度 (Yaw Rate)、航向角等。

5.  **相机墙 (Camera Wall)**:
    -   同步播放多路环视相机画面。

## 目录结构

```
src/
├── apis/           # API 请求层 (PointsService)
├── components/     # UI 组件
│   ├── PointCloudViewer.tsx      # 点云渲染
│   ├── BoundingBox3DVisualizer.tsx # 3D 框渲染
│   ├── CameraWall.tsx            # 相机图像展示
│   ├── CockpitPanel.tsx          # 仪表盘
│   └── ...
├── pages/          # 页面组件 (Dashboard)
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数 (Web Workers)
└── routes/         # 路由配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 性能优化策略

*   **Web Workers**: 将繁重的点云二进制数据解析（`DataView` 操作）转移到 Worker 线程。
*   **Request Cancellation**: 在快速切换帧时，自动取消未完成的 `fetch` 请求，防止网络拥塞。
*   **BufferGeometry**: 使用 Three.js 的 `BufferGeometry` 和 `TypedArray` 进行底层渲染优化，减少 CPU/GPU 开销。
