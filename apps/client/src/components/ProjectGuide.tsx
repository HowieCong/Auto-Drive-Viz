import { useState } from 'react';

export function ProjectGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState<'cn' | 'en'>('cn');

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid #00ffff',
                    color: '#00ffff',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}
            >
                <span style={{ fontSize: '14px' }}>📘</span>
                {lang === 'cn' ? '项目手册' : 'Guide'}
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                width: '800px',
                maxHeight: '90vh',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, color: '#fff' }}>
                        {lang === 'cn' ? 'AutoDriveViz 项目开发手册' : 'AutoDriveViz Development Guide'}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setLang(l => l === 'cn' ? 'en' : 'cn')}
                            style={{ background: '#333', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {lang === 'cn' ? 'English' : '中文'}
                        </button>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', color: '#888', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '30px', overflowY: 'auto', color: '#ccc', lineHeight: '1.6' }}>
                    
                    {/* Section 1: Overview */}
                    <Section title={lang === 'cn' ? '1. 项目架构 (Architecture)' : '1. Architecture'}>
                        <p>{lang === 'cn' 
                            ? '本项目采用 Monorepo 全栈架构，专为自动驾驶数据可视化设计。'
                            : 'This project adopts a Monorepo full-stack architecture designed for autonomous driving data visualization.'}
                        </p>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            <li><strong>Frontend:</strong> React + Vite + Three.js (R3F) + Leva (Controls)</li>
                            <li><strong>Backend:</strong> Nest.js + Express + Multer (File Handling)</li>
                            <li><strong>Data:</strong> KITTI Dataset (Raw Binary/XML Parsing)</li>
                        </ul>
                    </Section>

                    {/* Section 2: Highlights */}
                    <Section title={lang === 'cn' ? '2. 技术亮点 (Highlights)' : '2. Highlights'}>
                        <HighlightItem 
                            title={lang === 'cn' ? '真实数据集成 (Real Data Integration)' : 'Real Data Integration'}
                            desc={lang === 'cn' 
                                ? '不依赖预处理的 JSON，直接在后端解析 KITTI 原始二进制点云 (.bin) 和 XML 标注文件，通过 ArrayBuffer 高效传输。'
                                : 'Parses raw KITTI binary point clouds (.bin) and XML labels directly on the backend without pre-processed JSON, streaming via ArrayBuffer.'}
                        />
                        <HighlightItem 
                            title={lang === 'cn' ? '多传感器融合 (Sensor Fusion)' : 'Sensor Fusion'}
                            desc={lang === 'cn' 
                                ? '实现了 Lidar 点云与 Camera 图像的帧级同步。核心难点在于坐标系转换：Velodyne -> Rectified Camera -> Image Plane。'
                                : 'Achieved frame-level synchronization between Lidar point clouds and Camera images. The core challenge lies in coordinate transformation: Velodyne -> Rectified Camera -> Image Plane.'}
                        />
                        <HighlightItem 
                            title={lang === 'cn' ? '高性能渲染 (High-Performance Rendering)' : 'High-Performance Rendering'}
                            desc={lang === 'cn' 
                                ? '使用 Three.js 的 InstancedMesh 渲染数万个 Voxel 网格，保证了 Occupancy Grid 模式下的 60FPS 流畅体验。'
                                : 'Uses Three.js InstancedMesh to render tens of thousands of Voxel grids, ensuring a smooth 60FPS experience in Occupancy Grid mode.'}
                        />
                    </Section>

                    {/* Section 3: Challenges */}
                    <Section title={lang === 'cn' ? '3. 开发难点与解决方案 (Challenges)' : '3. Challenges & Solutions'}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#ff4444' }}>{lang === 'cn' ? '难点 1: 坐标系混乱' : 'Challenge 1: Coordinate Systems'}</strong>
                            <p style={{ margin: '5px 0' }}>
                                {lang === 'cn' 
                                    ? 'KITTI 使用 Camera 坐标系 (Z前方)，而 Three.js 使用右手坐标系 (Y上方)。'
                                    : 'KITTI uses Camera coordinates (Z-forward), while Three.js uses Right-handed coordinates (Y-up).'}
                            </p>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                                Solution: Velo_to_Cam Matrix * P_rect_02 Matrix
                            </div>
                        </div>
                        
                        <div>
                            <strong style={{ color: '#ff4444' }}>{lang === 'cn' ? '难点 2: 3D到2D投影准确性' : 'Challenge 2: 3D to 2D Projection Accuracy'}</strong>
                            <p style={{ margin: '5px 0' }}>
                                {lang === 'cn' 
                                    ? '简单的中心点投影无法正确包裹旋转的车辆。我们实现了完整的 8 顶点投影算法，计算出精确的 2D 包围盒。'
                                    : 'Simple center-point projection fails to wrap rotated vehicles. We implemented a full 8-vertex projection algorithm to calculate precise 2D bounding boxes.'}
                            </p>
                        </div>
                    </Section>

                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#00ffff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>{title}</h3>
            {children}
        </div>
    );
}

function HighlightItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#eee' }}>• {title}</strong>
            <p style={{ margin: '5px 0 0 20px', color: '#aaa', fontSize: '14px' }}>{desc}</p>
        </div>
    );
}
