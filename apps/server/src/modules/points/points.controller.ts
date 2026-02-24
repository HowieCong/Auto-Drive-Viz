import {
  Controller,
  Get,
  Post,
  Res,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  Headers,
  Res,
} from '@nestjs/common';
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
  async getOccupancy(@Query('frame') frame: string, @Query('file') file: string) {
    const frameIdx = parseInt(frame || '0', 10);
    return this.pointsService.getOccupancyData(frameIdx, file);
  }

  @Get('scene')
  async getSceneData(@Query('frame') frame: string, @Query('file') file: string) {
    const frameIdx = parseInt(frame || '0', 10);
    return this.pointsService.getSceneObjects(frameIdx, file);
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
    const buffer = await this.pointsService.getImageData(frameIdx, camera, file);
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
