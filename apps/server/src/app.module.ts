import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PointsModule } from './modules/points/points.module';

@Module({
  imports: [PointsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
