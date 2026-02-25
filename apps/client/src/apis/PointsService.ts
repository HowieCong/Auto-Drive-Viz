
import * as xml2js from 'xml2js';

import type { BoundingBox3D, EgoState, BoundingBox2D, Tracklet } from '../types';

export class PointsService {
  private kittiRoot = '/data/kitti/2011_09_26';
  private currentDrive = '2011_09_26_drive_0001_sync';
  private tracklets: Tracklet[] = [];
  private calibVeloToCam: number[][] = [];
  private calibCamToCam: Record<string, number[][]> = {};
  private loaded = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.loaded) return;
    try {
      // Load Calib
      const calibVelo = await fetch(`${this.kittiRoot}/calib_velo_to_cam.txt`).then(res => res.text());
      this.calibVeloToCam = this.parseVeloCalib(calibVelo);

      const calibCam = await fetch(`${this.kittiRoot}/calib_cam_to_cam.txt`).then(res => res.text());
      this.calibCamToCam = this.parseCamCalib(calibCam);

      // Load Tracklets
      const trackletUrl = `${this.kittiRoot}/${this.currentDrive}/tracklet_labels.xml`;
      const xml = await fetch(trackletUrl).then(res => res.text());
      
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);
      this.tracklets = this.processTracklets(result);
      
      this.loaded = true;
      console.log(`Loaded ${this.tracklets.length} tracklets`);
    } catch (e) {
      console.warn('Failed to load KITTI data:', e);
    }
  }

  private async ensureLoaded() {
      if (!this.loaded) await this.init();
  }

  async getSceneObjects(frame: number): Promise<{ objects: BoundingBox3D[]; ego: EgoState }> {
    await this.ensureLoaded();
    const effectiveFrame = frame; // Assuming single drive for now
    
    // Objects
    const currentTracks = this.tracklets.filter((t) => t.frame === effectiveFrame);
    const objects = currentTracks.map((t) => ({
        id: t.id,
        x: t.tx,
        y: t.ty,
        z: t.tz + t.h / 2,
        l: t.l,
        w: t.w,
        h: t.h,
        yaw: t.rz,
        label: t.type,
    }));

    // Ego
    const ego = await this.getRealEgoState(effectiveFrame);
    return { objects, ego };
  }

  async get2DBoxes(frame: number, camera: string): Promise<BoundingBox2D[]> {
      await this.ensureLoaded();
      return this.getReal2DBoxes(frame, camera);
  }

  private async getRealEgoState(frame: number): Promise<EgoState> {
      try {
          const name = frame.toString().padStart(10, '0') + '.txt';
          const url = `${this.kittiRoot}/${this.currentDrive}/oxts/${name}`; // Moved to public
          const res = await fetch(url);
          if (!res.ok) return { speed: 0, heading: 0, acceleration: 0, yawRate: 0, timestamp: Date.now() };
          
          const content = await res.text();
          const vals = content.trim().split(' ').map(Number);
          return {
              speed: vals[8],
              heading: vals[5],
              acceleration: vals[14],
              yawRate: vals[19],
              timestamp: Date.now()
          };
      } catch {
          return { speed: 0, heading: 0, acceleration: 0, yawRate: 0, timestamp: Date.now() };
      }
  }

  // --- Logic ported from Server ---
  private parseVeloCalib(content: string): number[][] {
    const lines = content.split('\n');
    const R_line = lines.find((l) => l.startsWith('R:'));
    const T_line = lines.find((l) => l.startsWith('T:'));

    if (!R_line || !T_line) return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];

    const R = R_line.split(' ').slice(1).map(Number).filter((n) => !isNaN(n));
    const T = T_line.split(' ').slice(1).map(Number).filter((n) => !isNaN(n));

    return [
      [R[0], R[1], R[2], T[0]],
      [R[3], R[4], R[5], T[1]],
      [R[6], R[7], R[8], T[2]],
      [0, 0, 0, 1],
    ];
  }

  private parseCamCalib(content: string): Record<string, number[][]> {
    const lines = content.split('\n');
    const calibs: Record<string, number[][]> = {};
    ['00', '01', '02', '03'].forEach((id) => {
      const line = lines.find((l) => l.startsWith(`P_rect_${id}:`));
      if (line) {
        const P = line.split(' ').slice(1).map(Number).filter((n) => !isNaN(n));
        calibs[id] = [
          [P[0], P[1], P[2], P[3]],
          [P[4], P[5], P[6], P[7]],
          [P[8], P[9], P[10], P[11]],
        ];
      }
    });
    return calibs;
  }

  private processTracklets(xml: any): Tracklet[] {
    const items = xml.boost_serialization.tracklets[0].item || [];
    const tracks: Tracklet[] = [];
    items.forEach((item: any, id: number) => {
      const type = item.objectType[0];
      const h = parseFloat(item.h[0]);
      const w = parseFloat(item.w[0]);
      const l = parseFloat(item.l[0]);
      const first_frame = parseInt(item.first_frame[0]);
      const poses = item.poses[0].item; 
      poses.forEach((pose: any, idx: number) => {
        const frame = first_frame + idx;
        tracks.push({
          id,
          frame,
          type,
          h, w, l,
          tx: parseFloat(pose.tx[0]),
          ty: parseFloat(pose.ty[0]),
          tz: parseFloat(pose.tz[0]),
          rx: parseFloat(pose.rx[0]),
          ry: parseFloat(pose.ry[0]),
          rz: parseFloat(pose.rz[0]),
        });
      });
    });
    return tracks;
  }

  private getReal2DBoxes(frame: number, camera: string): BoundingBox2D[] {
    const currentTracks = this.tracklets.filter((t) => t.frame === frame);
    const boxes: BoundingBox2D[] = [];
    const camId = camera.replace('image_', '');

    currentTracks.forEach((t) => {
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

      const cornersVelo = corners.map((p) => ({
          x: p.x * c - p.y * s + t.tx,
          y: p.x * s + p.y * c + t.ty,
          z: p.z + t.tz,
      }));

      let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
      let hasValidPoint = false;

      cornersVelo.forEach((p_velo) => {
        const p_cam = this.applyMatrix(p_velo, this.calibVeloToCam);
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

  private applyMatrix(p: { x: number; y: number; z: number }, m: number[][]) {
    const x = p.x * m[0][0] + p.y * m[0][1] + p.z * m[0][2] + m[0][3];
    const y = p.x * m[1][0] + p.y * m[1][1] + p.z * m[1][2] + m[1][3];
    const z = p.x * m[2][0] + p.y * m[2][1] + p.z * m[2][2] + m[2][3];
    return { x, y, z };
  }

  private projectCamToImage(x: number, y: number, z: number, cameraId: string) {
    if (z === 0) return null;
    const P = this.calibCamToCam[cameraId];
    if (!P) return null;
    const u = (P[0][0] * x + P[0][1] * y + P[0][2] * z + P[0][3]) / z;
    const v = (P[1][0] * x + P[1][1] * y + P[1][2] * z + P[1][3]) / z;
    return { u, v };
  }
}

export const pointsService = new PointsService();
