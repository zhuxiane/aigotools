import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BasicAuthMiddleware } from './middleware/basic-auth.middleware';
import { Site, SiteSchema } from './schemas/site.schema';
import { SiteQueueModule } from './site-queue/site-queue.module';
// import { MinioService } from './providers/minio.service';
import * as schema from './db/schema';
import { DrizzleTursoModule } from '@knaadh/nestjs-drizzle-turso';
import { JobsService } from './providers/job.service';
import { RedisService } from './providers/redis.service';
import { BrowserService } from './providers/browser.service';
import { S3Service } from './providers/s3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env.prod', '.env.dev', '.env'],
    }),
    ScheduleModule.forRoot(),
    DrizzleTursoModule.registerAsync({
      tag: 'DB',
      useFactory(configService: ConfigService) {
        const url = configService.get('TURSO_DATABASE_URL');
        const token = configService.get('TURSO_AUTH_TOKEN');
        let config: any = {
          url,
        };

        // 开发环境不需要token
        if (token) {
          config = {
            ...config,
            token,
          };
        }
        return {
          turso: {
            config,
          },
          config: { schema: { ...schema } },
        };
      },
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    // MongooseModule.forRootAsync({
    //   useFactory: (configService: ConfigService) => ({
    //     uri: configService.get('MONGODB_URI'),
    //   }),
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    // }),
    // MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
    BullModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          redis: {
            db: configService.get('REDIS_DB'),
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASS'),
          },
        };
      },
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    BullBoardModule.forRootAsync({
      useFactory() {
        return {
          route: '/queues',
          adapter: ExpressAdapter,
          middleware: BasicAuthMiddleware,
        };
      },
      imports: [ConfigModule],
    }),
    // SiteQueueModule,
    ThrottlerModule.forRoot([
      {
        ttl: 1 * 1000,
        limit: 10,
      },
      {
        ttl: 10 * 1000,
        limit: 50,
      },
      {
        ttl: 60 * 1000,
        limit: 200,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    JobsService,
    RedisService,
    BrowserService,
    S3Service,
    // MinioService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BasicAuthMiddleware).forRoutes('/');
  }
}
