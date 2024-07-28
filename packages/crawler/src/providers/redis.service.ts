import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as IORedisClient } from '@upstash/redis';
import { SITE_CRAWL_JOB, SITE_QUEUE_NAME } from '../site-queue/site-queue.constant';

@Injectable()
export class RedisService implements OnModuleInit {
  readonly redisClient: IORedisClient;
  constructor(private configService: ConfigService) {
    this.redisClient = new IORedisClient({
      url: configService.get('UPSTASH_REDIS_REST_URL'),
      token: configService.get('UPSTASH_REDIS_REST_TOKEN'),
    })
  }

  onModuleInit() {
    this.logRedisLifeCycle('RedisService', this.redisClient);
  }

  async getJobs(maxJobs: number): Promise<string[]> {
    const jobs: string[] = [];
    for (let i = 0; i < maxJobs; i++) {
      const job = await this.redisClient.rpop(SITE_CRAWL_JOB);
      if (job) {
        jobs.push(job);
      } else {
        break;
      }
    }
    return jobs;
  }

  private logRedisLifeCycle(name: string, client: IORedisClient) {
    // if (client.status === 'ready') {
    //   Logger.log('Redis is ready');
    // }

    // client.on('ready', () => {
    //   Logger.log('Redis is ready');
    // });

    // client.on('connect', () => {
    //   Logger.log('Redis connected');
    // });

    // client.on('reconnecting', () => {
    //   Logger.log('Redis reconnecting');
    // });

    // client.on('error', (error) => {
    //   Logger.error(`Redis error: ${error}`);
    // });

    // client.on('end', () => {
    //   Logger.log('Redis connection closed');
    // });
  }
}
