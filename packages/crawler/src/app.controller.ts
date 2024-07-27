import { Body, Controller, Post, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService, BatchParams } from './app.service';
import { MinioService } from './providers/minio.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    // private readonly minioService: MinioService,
  ) {}

  @Get('test')
  async test() {
    await this.appService.test();
  }

  @Post('dispatch')
  async batchDispatchSites(@Body() body: BatchParams) {
    const count = await this.appService.batchDispatchSiteCrawl(body);
    return count;
  }

  @Post('stop')
  async batchStopSites(@Body() body: BatchParams) {
    const count = await this.appService.batchStopSiteCrawl(body);
    return count;
  }
}
