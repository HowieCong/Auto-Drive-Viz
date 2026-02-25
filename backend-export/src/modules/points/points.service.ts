import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
// import { list, put } from '@vercel/blob';
import { BoundingBox3D, EgoState, BoundingBox2D } from '../../common/types';

@Injectable()
export class PointsService implements OnModuleInit {
  // private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly kittiRoot = path.join(
    process.cwd(),
    '../client/public/data/kitti/2011_09_26',
  );
  private currentDrive = '2011_09_26_drive_0001_sync';
  private readonly BLOB_BASE_URL = process.env.BLOB_BASE_URL; // e.g., https://xyz.public.blob.vercel-storage.com

  // Cache
  private tracklets: any[] = [];
  private calibVeloToCam: number[][] = []; // 4x4
  private calibCamToCam: Record<string, number[][]> = {}; // P_rect_00, 01, 02, 03

  constructor() {
    // if (!fs.existsSync(this.uploadDir)) {
    //   fs.mkdirSync(this.uploadDir);
    // }
  }

  async onModuleInit() {
    await this.loadKittiData();
  }

  // Helper to get data either from FS or Blob
  private async getData(
    relativePath: string,
    isBinary = false,
  ): Promise<Buffer | string> {
    // If BLOB_BASE_URL is set, fetch from Blob
    if (this.BLOB_BASE_URL) {
      const url = `${this.BLOB_BASE_URL}/${relativePath}`;
      console.log(`Fetching from Blob: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch blob: ${url}`);
      if (isBinary) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } else {
        return await res.text();
      }
    }

    // Fallback to local FS
    const localPath = path.join(this.kittiRoot, relativePath);
    if (fs.existsSync(localPath)) {
      if (isBinary) {
        return fs.readFileSync(localPath);
      } else {
        return fs.readFileSync(localPath, 'utf8');
      }
    }
    throw new Error(`File not found: ${localPath}`);
  }

  async reloadData() {
    await this.loadKittiData();
    return {
      tracklets: this.tracklets.length,
      calibVelo: this.calibVeloToCam.length > 0,
      calibCam: Object.keys(this.calibCamToCam).length > 0,
    };
  }

  async ensureDriveLoaded(drive: string) {
    if (this.currentDrive !== drive) {
      console.log(`Switching drive from ${this.currentDrive} to ${drive}`);
      this.currentDrive = drive;
      await this.loadKittiData();
    }
  }

  async loadKittiData() {
    try {
      // 1. Load Calib (Global for date, usually same for same day)
      const calibVelo = (await this.getData('calib_velo_to_cam.txt')) as string;
      this.calibVeloToCam = this.parseVeloCalib(calibVelo);

      const calibCam = (await this.getData('calib_cam_to_cam.txt')) as string;
      this.calibCamToCam = this.parseCamCalib(calibCam);
      console.log('Loaded Calibration');

      // 2. Load Tracklets for Current Drive
      const trackletPath = `${this.currentDrive}/tracklet_labels.xml`;
      try {
        const xml = (await this.getData(trackletPath)) as string;
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);
        this.tracklets = this.processTracklets(result);
        console.log(
          `Loaded ${this.tracklets.length} tracklets for ${this.currentDrive}`,
        );
      } catch {
        console.warn('Tracklet file not found or load failed:', trackletPath);
        this.tracklets = [];
      }
    } catch (e) {
      console.warn(
        'Failed to load KITTI data (ignore if running mock only):',
        e.message,
      );
    }
  }

  // --- Kitti Helpers ---
  parseVeloCalib(content: string): number[][] {
    const lines = content.split('\n');
    const R_line = lines.find((l) => l.startsWith('R:'));
    const T_line = lines.find((l) => l.startsWith('T:'));

    if (!R_line || !T_line)
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];

    const R = R_line.split(' ')
      .slice(1)
      .map(Number)
      .filter((n) => !isNaN(n));
    const T = T_line.split(' ')
      .slice(1)
      .map(Number)
      .filter((n) => !isNaN(n));

    // Construct 4x4
    return [
      [R[0], R[1], R[2], T[0]],
      [R[3], R[4], R[5], T[1]],
      [R[6], R[7], R[8], T[2]],
      [0, 0, 0, 1],
    ];
  }

  parseCamCalib(content: string): Record<string, number[][]> {
    const lines = content.split('\n');
    const calibs: Record<string, number[][]> = {};

    ['00', '01', '02', '03'].forEach((id) => {
      const line = lines.find((l) => l.startsWith(`P_rect_${id}:`));
      if (line) {
        const P = line
          .split(' ')
          .slice(1)
          .map(Number)
          .filter((n) => !isNaN(n));
        calibs[id] = [
          [P[0], P[1], P[2], P[3]],
          [P[4], P[5], P[6], P[7]],
          [P[8], P[9], P[10], P[11]],
        ];
      }
    });

    return calibs;
  }

  processTracklets(xml: any): any[] {
    // KITTI XML format parsing
    // <item> <objectType>Car</objectType> <h>...</h> <w>...</w> <l>...</l> <first_frame>...</first_frame> <poses>...</poses> </item>
    const items = xml.boost_serialization.tracklets[0].item || [];
    const tracks: any[] = [];

    items.forEach((item: any, id: number) => {
      const type = item.objectType[0];
      const h = parseFloat(item.h[0]);
      const w = parseFloat(item.w[0]);
      const l = parseFloat(item.l[0]);
      const first_frame = parseInt(item.first_frame[0]);
      const poses = item.poses[0].item; // Array of pose

      poses.forEach((pose: any, idx: number) => {
        const frame = first_frame + idx;
        const tx = parseFloat(pose.tx[0]);
        const ty = parseFloat(pose.ty[0]);
        const tz = parseFloat(pose.tz[0]);
        const rx = parseFloat(pose.rx[0]);
        const ry = parseFloat(pose.ry[0]);
        const rz = parseFloat(pose.rz[0]);

        tracks.push({
          id,
          frame,
          type,
          h,
          w,
          l,
          tx,
          ty,
          tz,
          rx,
          ry,
          rz,
        });
      });
    });
    return tracks;
  }

  getKittiFrameCount(): number {
    try {
      const dir = path.join(
        this.kittiRoot,
        this.currentDrive,
        'velodyne_points/data',
      );
      return fs.readdirSync(dir).length;
    } catch {
      return 0;
    }
  }

  async getDriveMetadata(drive: string): Promise<any[]> {
    await this.ensureDriveLoaded(drive);
    const count = this.getKittiFrameCount();
    const frames = [];

    // Batch collect all frames
    for (let i = 0; i < count; i++) {
      const effectiveFrame = this.getEffectiveFrame(drive, i);
      const { objects, ego } = await this.getRealSceneObjects(effectiveFrame);
      frames.push({
        frame: i,
        objects,
        ego,
      });
    }
    return frames;
  }

  // --- Real Data Getters ---

  async getRealImage(
    frame: number,
    camera: string = 'image_02',
  ): Promise<Buffer> {
    // camera: image_00, image_01, image_02, image_03
    const name = frame.toString().padStart(10, '0') + '.png';
    const relativePath = `${this.currentDrive}/${camera}/data/${name}`;

    // For images, we can redirect (better) or proxy.
    // Here we proxy to keep API consistent.
    const data = await this.getData(relativePath, true);
    return data as Buffer;
  }

  async getRealLidar(frame: number): Promise<Buffer> {
    // velodyne_points/data/0000000000.bin
    const name = frame.toString().padStart(10, '0') + '.bin';
    const relativePath = `${this.currentDrive}/velodyne_points/data/${name}`;

    const data = await this.getData(relativePath, true);
    return data as Buffer;
  }

  async getRealSceneObjects(frame: number): Promise<{
    objects: BoundingBox3D[];
    ego: EgoState;
  }> {
    // Find tracklets for this frame
    const currentTracks = this.tracklets.filter((t) => t.frame === frame);

    const objects: BoundingBox3D[] = currentTracks.map((t) => {
      // Tracklet is in Velodyne Coords
      return {
        id: t.id,
        x: t.tx,
        y: t.ty,
        z: t.tz + t.h / 2, // Shift from bottom-center to center-center
        l: t.l,
        w: t.w,
        h: t.h,
        yaw: t.rz, // Rotation around Z
        label: t.type,
      };
    });

    return {
      objects,
      ego: await this.getRealEgoState(frame),
    };
  }

  async getRealEgoState(frame: number): Promise<EgoState> {
    try {
      // oxts/data/0000000000.txt
      const name = frame.toString().padStart(10, '0') + '.txt';
      const relativePath = `${this.currentDrive}/oxts/data/${name}`;

      const content = (await this.getData(relativePath)) as string;
      const vals = content.trim().split(' ').map(Number);

      const speed = vals[8]; // vf (forward velocity)
      const heading = vals[5]; // yaw
      const acceleration = vals[14]; // af
      const yawRate = vals[19]; // wz

      return {
        speed: speed, // m/s
        heading: heading,
        acceleration: acceleration,
        yawRate: yawRate,
        timestamp: Date.now(), // Mock timestamp or calculate from frame
      };
    } catch {
      // ignore
    }
    return {
      speed: 0,
      heading: 0,
      acceleration: 0,
      yawRate: 0,
      timestamp: Date.now(),
    };
  }

  getReal2DBoxes(frame: number, camera: string = 'image_02'): BoundingBox2D[] {
    // Project 3D tracklets (Velo) to 2D image (Cam) using Tr_velo_to_cam and P_rect_02
    const currentTracks = this.tracklets.filter((t) => t.frame === frame);
    const boxes: BoundingBox2D[] = [];

    // Map 'image_xx' to 'xx'
    const camId = camera.replace('image_', '');

    currentTracks.forEach((t) => {
      // 1. Calculate 8 corners in Velodyne Coordinates
      // KITTI Tracklet: tx, ty, tz are bottom-center (usually).
      // Dimensions: l (length, x-axis), w (width, y-axis), h (height, z-axis).
      // Rotation: rz (yaw) around Z-axis.

      const c = Math.cos(t.rz);
      const s = Math.sin(t.rz);

      const corners = [
        { x: t.l / 2, y: t.w / 2, z: 0 },
        { x: t.l / 2, y: -t.w / 2, z: 0 },
        { x: -t.l / 2, y: t.w / 2, z: 0 },
        { x: -t.l / 2, y: -t.w / 2, z: 0 },
        { x: t.l / 2, y: t.w / 2, z: t.h },
        { x: t.l / 2, y: -t.w / 2, z: t.h },
        { x: -t.l / 2, y: t.w / 2, z: t.h },
        { x: -t.l / 2, y: -t.w / 2, z: t.h },
      ];

      // Rotate and Translate
      const cornersVelo = corners.map((p) => {
        // Rotate around Z
        const x_rot = p.x * c - p.y * s;
        const y_rot = p.x * s + p.y * c;
        // Translate
        return {
          x: x_rot + t.tx,
          y: y_rot + t.ty,
          z: p.z + t.tz,
        };
      });

      // 2. Transform Velo -> Cam -> Image
      let minU = Infinity;
      let minV = Infinity;
      let maxU = -Infinity;
      let maxV = -Infinity;
      let hasValidPoint = false;

      cornersVelo.forEach((p_velo) => {
        const p_cam = this.applyMatrix(p_velo, this.calibVeloToCam);

        // Check if point is in front of camera (Z > 0)
        if (p_cam.z > 0) {
          const uv = this.projectCamToImage(p_cam.x, p_cam.y, p_cam.z, camId);
          if (uv) {
            hasValidPoint = true;
            minU = Math.min(minU, uv.u);
            minV = Math.min(minV, uv.v);
            maxU = Math.max(maxU, uv.u);
            maxV = Math.max(maxV, uv.v);
          }
        }
      });

      if (hasValidPoint && minU < maxU && minV < maxV) {
        // Clip to image boundaries (approx 1242x375 for KITTI)
        // We can let frontend handle clipping or do it here.
        // Let's just pass the projected box.

        boxes.push({
          x: minU,
          y: minV,
          w: maxU - minU,
          h: maxV - minV,
          label: t.type,
          confidence: 1.0,
        });
      }
    });
    return boxes;
  }

  // --- Math Helpers ---

  applyMatrix(p: { x: number; y: number; z: number }, m: number[][]) {
    // 4x4 mult
    const x = p.x * m[0][0] + p.y * m[0][1] + p.z * m[0][2] + m[0][3];
    const y = p.x * m[1][0] + p.y * m[1][1] + p.z * m[1][2] + m[1][3];
    const z = p.x * m[2][0] + p.y * m[2][1] + p.z * m[2][2] + m[2][3];
    return { x, y, z };
  }

  projectCamToImage(x: number, y: number, z: number, cameraId: string = '02') {
    if (z === 0) return null;
    const P = this.calibCamToCam[cameraId]; // Use specific camera matrix
    if (!P) return null;

    // u = (P00*x + P01*y + P02*z + P03) / z
    // v = (P10*x + P11*y + P12*z + P13) / z

    const u = (P[0][0] * x + P[0][1] * y + P[0][2] * z + P[0][3]) / z;
    const v = (P[1][0] * x + P[1][1] * y + P[1][2] * z + P[1][3]) / z;
    return { u, v };
  }

  // --- Public API Implementations ---

  // Helper to simulate a "Different" dataset by reversing the playback for drive_0005
  // Total frames: 108 (0 to 107)
  private getEffectiveFrame(drive: string | undefined, frame: number): number {
    // If it's the duplicated dataset (0005), reverse the frame index!
    if (drive && drive.includes('drive_0005')) {
      const MAX_FRAME = 107;
      return Math.max(0, MAX_FRAME - frame);
    }
    return frame;
  }

  async getSampleData(frameIndex: number = 0, drive?: string): Promise<Buffer> {
    try {
      if (drive) await this.ensureDriveLoaded(drive);
      const effectiveFrame = this.getEffectiveFrame(drive, frameIndex);
      return await this.getRealLidar(effectiveFrame);
    } catch {
      return Buffer.alloc(0);
    }
  }

  async getSceneObjects(
    frameIndex: number,
    drive?: string,
  ): Promise<{
    objects: BoundingBox3D[];
    ego: EgoState;
  }> {
    try {
      if (drive) await this.ensureDriveLoaded(drive);
      // Note: We don't reverse frame for objects here because we handle it in processTracklets or we should pass effectiveFrame?
      // Actually, if we reverse the inputs (Lidar/Image), we should also reverse the Ground Truth.
      // But tracklets are loaded once.
      // Let's handle it by passing effectiveFrame to getRealSceneObjects,
      // BUT getRealSceneObjects filters by t.frame.
      // So we just need to pass the effective frame.
      const effectiveFrame = this.getEffectiveFrame(drive, frameIndex);

      const result = await this.getRealSceneObjects(effectiveFrame);

      // If reversed, we might want to rotate the bounding boxes 180 deg?
      // No, the world is static, the ego is moving backwards.
      // The tracklet frame matches the lidar/image frame. So it's consistent.
      return result;
    } catch {
      return {
        objects: [],
        ego: {
          speed: 0,
          heading: 0,
          acceleration: 0,
          yawRate: 0,
          timestamp: Date.now(),
        },
      };
    }
  }

  async get2DBoxes(
    frameIndex: number,
    camera: string = 'front',
    drive?: string,
  ): Promise<BoundingBox2D[]> {
    try {
      if (drive) await this.ensureDriveLoaded(drive);
      const effectiveFrame = this.getEffectiveFrame(drive, frameIndex);
      return this.getReal2DBoxes(effectiveFrame, camera);
    } catch {
      return [];
    }
  }

  async getImageData(
    frameIndex: number,
    camera: string = 'image_02',
    drive?: string,
  ): Promise<Buffer> {
    try {
      if (drive) await this.ensureDriveLoaded(drive);
      const effectiveFrame = this.getEffectiveFrame(drive, frameIndex);
      return await this.getRealImage(effectiveFrame, camera);
    } catch {
      throw new Error(`Image not found for frame ${frameIndex}`);
    }
  }

  getFiles(): string[] {
    try {
      // If Blob, we might need to list blobs. For now, static list or mock.
      if (this.BLOB_BASE_URL) {
        // This is a placeholder. In real blob storage, we would list prefixes.
        // For MVP, we just return the known drive.
        return ['2011_09_26_drive_0001_sync'];
      }

      if (!fs.existsSync(this.kittiRoot)) return [];
      return fs
        .readdirSync(this.kittiRoot)
        .filter((file) =>
          fs.statSync(path.join(this.kittiRoot, file)).isDirectory(),
        )
        .filter((dir) => dir.includes('_drive_')); // Filter to only drive folders
    } catch {
      return [];
    }
  }
}
