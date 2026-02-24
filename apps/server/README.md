# Auto-Drive-Viz 后端

后端应用基于 **NestJS** 框架构建，提供 RESTful API 以服务自动驾驶数据集（如 KITTI）。

## 核心技术栈

-   **NestJS**: 高效、可扩展的 Node.js 框架
-   **TypeScript**: 强类型语言支持
-   **Express**: 底层 HTTP 服务

## 主要功能

1.  **数据服务**:
    -   读取并提供 LiDAR 点云二进制文件 (`.bin`)。
    -   读取并提供相机图像文件 (`.png`)。
    -   读取并解析 OXTS 车辆状态数据 (`.txt`)。

2.  **坐标转换与投影**:
    -   处理 Velodyne 到 Camera 的坐标变换 (`Tr_velo_to_cam`)。
    -   处理 3D 空间到 2D 图像平面的透视投影 (`P_rect_xx`)。

3.  **Tracklet 解析**:
    -   解析 KITTI 格式的 XML 标注文件 (`tracklet_labels.xml`)，提取 3D 目标信息。

## 目录结构

```
src/
├── common/         # 公共模块
│   └── types/      # 共享类型定义
├── modules/        # 业务模块
│   └── points/     # 点云与数据服务模块
│       ├── points.controller.ts  # API 控制器
│       ├── points.service.ts     # 业务逻辑与数据处理
│       └── points.module.ts      # 模块定义
├── app.module.ts   # 根模块
└── main.ts         # 应用入口
```

## API 接口

*   `GET /points/scene`: 获取指定帧的场景数据（自车状态、3D 对象列表）。
*   `GET /points/sample`: 获取指定帧的原始 LiDAR 点云数据（二进制流）。
*   `GET /points/image`: 获取指定帧、指定相机的图像数据。
*   `GET /points/boxes`: 获取投影到 2D 图像上的边界框数据。
*   `GET /points/list`: 获取可用的数据集列表。

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run start:dev
```

### 构建生产版本

```bash
npm run build
```

## 数据配置

默认数据路径配置在 `PointsService` 中。请确保 KITTI 数据集按照标准目录结构放置，或修改 `kittiRoot` 路径以匹配您的本地环境。
