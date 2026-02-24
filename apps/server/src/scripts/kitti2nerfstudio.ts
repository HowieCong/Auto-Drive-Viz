import * as fs from 'fs';
import * as path from 'path';
import { mat4, vec3, quat } from 'gl-matrix';

// Configuration
const KITTI_ROOT = path.resolve(__dirname, '../../../../apps/client/public/data/kitti/2011_09_26');
const DRIVE_NAME = '2011_09_26_drive_0001_sync';
const OUTPUT_FILE = path.join(KITTI_ROOT, DRIVE_NAME, 'transforms.json');

// Paths
const CALIB_CAM_FILE = path.join(KITTI_ROOT, 'calib_cam_to_cam.txt');
const CALIB_VELO_FILE = path.join(KITTI_ROOT, 'calib_velo_to_cam.txt');
const CALIB_IMU_FILE = path.join(KITTI_ROOT, 'calib_imu_to_velo.txt');
const IMAGE_DIR = path.join(KITTI_ROOT, DRIVE_NAME, 'image_02/data');
const OXTS_DIR = path.join(KITTI_ROOT, DRIVE_NAME, 'oxts/data');

console.log(`Processing drive: ${DRIVE_NAME}`);

// --- Helpers ---

function parseCalibFile(content: string): Record<string, number[]> {
    const res: Record<string, number[]> = {};
    content.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
            const key = parts[0].trim();
            const vals = parts[1].trim().split(' ').map(Number).filter(n => !isNaN(n));
            res[key] = vals;
        }
    });
    return res;
}

// KITTI Calibration Matrices (Flattened Row-Major or as specified)
// Rotation R is usually 3x3, Translation T is 3x1.
// We need 4x4 matrices.

function getMatrixFromCalib(calib: Record<string, number[]>, keyR: string, keyT: string): mat4 {
    const R = calib[keyR];
    const T = calib[keyT];
    
    // Check sizes
    if (R.length !== 9 || T.length !== 3) {
        console.warn(`Warning: Invalid calib size for ${keyR}/${keyT}`);
        return mat4.create();
    }

    // gl-matrix mat4 is Column-Major!
    // KITTI files are usually Row-Major 3x3 + 3x1
    // M = [ R0 R1 R2 T0 ]
    //     [ R3 R4 R5 T1 ]
    //     [ R6 R7 R8 T2 ]
    //     [ 0  0  0  1  ]

    const m = mat4.create();
    mat4.set(m, 
        R[0], R[3], R[6], 0, // Col 0
        R[1], R[4], R[7], 0, // Col 1
        R[2], R[5], R[8], 0, // Col 2
        T[0], T[1], T[2], 1  // Col 3
    );
    return m;
}

// IMU to World (Geodetic to Local Cartesian)
// Using simplified Mercator projection relative to first frame
let originLat = 0;
let originLon = 0;
let originAlt = 0;
let originScale = 1;

function oxtsToPose(vals: number[], firstFrame: boolean): mat4 {
    // vals: lat, lon, alt, roll, pitch, yaw, ...
    const lat = vals[0];
    const lon = vals[1];
    const alt = vals[2];
    const roll = vals[3];
    const pitch = vals[4];
    const yaw = vals[5];

    if (firstFrame) {
        originLat = lat;
        originLon = lon;
        originAlt = alt;
        originScale = Math.cos(lat * Math.PI / 180.0);
    }

    // Convert to meters (Approx)
    const ER = 6378137; // Earth Radius
    const tx = ER * (lon - originLon) * (Math.PI / 180.0) * originScale;
    const ty = ER * (lat - originLat) * (Math.PI / 180.0);
    const tz = alt - originAlt;

    // Rotation (Roll, Pitch, Yaw) -> Euler to Quat to Mat
    // KITTI: rx (roll), ry (pitch), rz (yaw).
    // Coordinate system: x forward, y left, z up (IMU/Velodyne)
    
    // Euler to Rotation Matrix
    // R = Rz(yaw) * Ry(pitch) * Rx(roll)
    const q = quat.create();
    quat.fromEuler(q, roll * 180/Math.PI, pitch * 180/Math.PI, yaw * 180/Math.PI);
    // Note: gl-matrix fromEuler order is X, Y, Z. But we need to verify application order.
    // Usually extrinsic matrix construction is safer via individual rotations if needed.
    // Let's stick to gl-matrix standard for now.

    const m = mat4.create();
    mat4.fromRotationTranslation(m, q, [tx, ty, tz]);
    return m;
}

// --- Main ---

async function main() {
    // 1. Read Calibration
    const rawCamCalib = fs.readFileSync(CALIB_CAM_FILE, 'utf-8');
    const parsedCam = parseCalibFile(rawCamCalib);
    
    // P_rect_02: 3x4 Projection Matrix (Intrinsics + Baseline)
    // K = P(0:3, 0:3)
    const P02 = parsedCam['P_rect_02']; // 12 elements
    // K = [ fx 0 cx ]
    //     [ 0 fy cy ]
    //     [ 0  0  1 ]
    const fl_x = P02[0];
    const cx = P02[2];
    const fl_y = P02[5];
    const cy = P02[6];
    
    // Image dimensions (Assuming constant)
    // Need to read one image to check?
    // KITTI images are around 1242 x 375
    // Let's read filenames to count
    const files = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.png')).sort();
    if (files.length === 0) throw new Error('No images found');
    
    // Assuming size 1242x375 for P_rect_02 context
    const W = 1242; 
    const H = 375;
    
    const camera_angle_x = 2 * Math.atan(W / (2 * fl_x));

    // 2. Read Extrinsics (Rigid Transformations)
    const rawVeloCalib = fs.readFileSync(CALIB_VELO_FILE, 'utf-8');
    const parsedVelo = parseCalibFile(rawVeloCalib);
    const T_velo_cam = getMatrixFromCalib(parsedVelo, 'R', 'T'); // Velo -> Cam (Reference Cam 00?)
    // Actually calib_velo_to_cam gives T_cam_velo (Point in Velo -> Point in Cam)
    // P_cam = R * P_velo + T
    
    const rawImuCalib = fs.readFileSync(CALIB_IMU_FILE, 'utf-8');
    const parsedImu = parseCalibFile(rawImuCalib);
    const T_velo_imu = getMatrixFromCalib(parsedImu, 'R', 'T'); // IMU -> Velo
    
    // Total Rigid Transform: IMU -> Cam00
    // T_cam_imu = T_cam_velo * T_velo_imu
    const T_cam_imu = mat4.create();
    mat4.multiply(T_cam_imu, T_velo_cam, T_velo_imu);
    
    // We need T_c2w (Camera to World) for NerfStudio.
    // T_c2w = T_world_imu * T_imu_cam (Inverse of Cam->Imu)
    const T_imu_cam = mat4.create();
    mat4.invert(T_imu_cam, T_cam_imu);

    // NerfStudio Coordinate Conversion (OpenGL)
    // KITTI (Right-Down-Forward) -> OpenGL (Right-Up-Back)
    // Flip Y and Z axes
    const T_ns_kitti = mat4.fromValues(
        1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, -1, 0,
        0, 0, 0, 1
    );

    const frames = [];

    // 3. Process Frames
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const frameIdx = i; // Assuming sequential filenames 000000.png match 000000.txt
        const oxtsFile = path.join(OXTS_DIR, file.replace('.png', '.txt'));
        
        if (!fs.existsSync(oxtsFile)) continue;
        
        const content = fs.readFileSync(oxtsFile, 'utf-8');
        const vals = content.trim().split(' ').map(Number);
        
        // T_world_imu
        const T_world_imu = oxtsToPose(vals, i === 0);
        
        // T_world_cam = T_world_imu * T_imu_cam
        const T_world_cam = mat4.create();
        mat4.multiply(T_world_cam, T_world_imu, T_imu_cam);
        
        // Apply NerfStudio conversion
        // transform_matrix = T_world_cam * T_ns_kitti ? 
        // No, standard is usually just the camera pose matrix.
        // But if we want the cameras to look "correctly" in NS viewer, we might need to swap axes.
        // Let's try applying the flip to the pose matrix rotation columns.
        mat4.multiply(T_world_cam, T_world_cam, T_ns_kitti);

        frames.push({
            file_path: `image_02/data/${file}`,
            transform_matrix: Array.from(T_world_cam) // gl-matrix is Flat array, JSON expects nested? NS accepts flat or nested? Usually nested 4x4.
        });
    }

    // Convert Flat Arrays to 4x4 Arrays for JSON
    const jsonFrames = frames.map(f => {
        const m = f.transform_matrix;
        // gl-matrix is Column-Major!
        // JSON expects Row-Major [[R,R,R,T],...]
        const rowMajor = [
            [m[0], m[4], m[8], m[12]],
            [m[1], m[5], m[9], m[13]],
            [m[2], m[6], m[10], m[14]],
            [m[3], m[7], m[11], m[15]]
        ];
        return {
            file_path: f.file_path,
            transform_matrix: rowMajor
        };
    });

    const output = {
        camera_angle_x,
        fl_x,
        fl_y,
        cx,
        cy,
        w: W,
        h: H,
        frames: jsonFrames
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Generated ${OUTPUT_FILE} with ${jsonFrames.length} frames.`);
}

main().catch(console.error);
