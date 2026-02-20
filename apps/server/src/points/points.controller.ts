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
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PointsService } from './points.service';
import { Response } from 'express';
import { Express } from 'express';

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

  @Post('search')
  async search(@Body('query') query: string) {
    return this.pointsService.searchScenes(query);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.pointsService.saveFile(file);
  }

  @Get('list')
  listFiles() {
    return this.pointsService.getFiles();
  }

  @Get('file/:name')
  getFile(
    @Param('name') name: string,
    @Res() res: Response,
    @Headers('range') range: string,
  ) {
    if (name.endsWith('.mp4') && range) {
      const { size } = this.pointsService.getVideoStream(name);
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = end - start + 1;

      this.pointsService.getVideoStream(name).stream.pipe(res);
      const head = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(206, head);
      return;
    }

    const buffer = this.pointsService.getFileBuffer(name);
    let contentType = 'application/octet-stream';
    if (name.endsWith('.mp4')) contentType = 'video/mp4';
    if (name.endsWith('.json')) contentType = 'application/json';

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
    });
    res.send(buffer);
  }
}
