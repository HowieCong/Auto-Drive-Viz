import { Controller, Get, Post, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('sample')
  async getSampleData(
    @Query('frame') frame: string,
    @Query('file') file: string,
    @Res() res: Response,
  ) {
    const frameIdx = parseInt(frame || '0', 10);
    const buffer = await this.pointsService.getSampleData(frameIdx, file);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
    });
    res.send(buffer);
  }

  @Get('occupancy')
  async getOccupancy(
    @Query('frame') frame: string,
    @Query('file') file: string,
  ) {
    const frameIdx = parseInt(frame || '0', 10);
    return this.pointsService.getOccupancyData(frameIdx, file);
  }

  @Get('scene')
  async getSceneData(
    @Query('frame') frame: string,
    @Query('file') file: string,
    @Query('source') source: string = 'gt',
  ) {
    const frameIdx = parseInt(frame || '0', 10);

    // Get Ground Truth
    const scene = await this.pointsService.getSceneObjects(frameIdx, file);

    // If source is model, replace objects with inference results
    if (source === 'model') {
      const detectedObjects = await this.pointsService.getInferenceObjects(
        frameIdx,
        file,
      );
      if (detectedObjects.length > 0) {
        scene.objects = detectedObjects;
      }
    }

    return scene;
  }

  @Get('drive/metadata')
  async getDriveMetadata(@Query('file') file: string) {
    return this.pointsService.getDriveMetadata(file);
  }

  @Get('boxes')
  async get2DBoxes(
    @Query('frame') frame: string,
    @Query('camera') camera: string,
    @Query('file') file: string,
  ) {
    const frameIdx = parseInt(frame || '0', 10);
    return this.pointsService.get2DBoxes(frameIdx, camera || 'front', file);
  }

  @Get('image')
  async getImage(
    @Query('frame') frame: string,
    @Query('camera') camera: string,
    @Query('file') file: string,
    @Res() res: Response,
  ) {
    const frameIdx = parseInt(frame || '0', 10);
    const buffer = await this.pointsService.getImageData(
      frameIdx,
      camera,
      file,
    );
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
    });
    res.send(buffer);
  }

  @Post('reload')
  reload() {
    return this.pointsService.reloadData();
  }

  @Get('list')
  listFiles() {
    return this.pointsService.getFiles();
  }
}
