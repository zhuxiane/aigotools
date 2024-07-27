import { Injectable, Inject, Logger } from '@nestjs/common';
// import { FilterQuery, Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
import { SiteQueueProducer } from './site-queue/site-queue.producer';
import * as schema from './db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, inArray, sql, or, and, like } from 'drizzle-orm';
import { SiteState, ProcessStage } from './lib/constants';

export interface BatchParams {
  query?: {
    state?: SiteState;
    processStage?: ProcessStage;
    search?: string;
  };
  siteIds?: number[];
}

@Injectable()
export class AppService {
  constructor(
    // @InjectModel(Site.name) private siteModel: Model<Site>,
    @Inject('DB') private db: LibSQLDatabase<typeof schema>,
    // @Inject('DB_PROD') private drizzleProd: LibSQLDatabase<typeof schema>,
    private readonly siteQueueProducer: SiteQueueProducer,
  ) {}

  private generateBatchQuery(params: BatchParams) {
    const conditions = [];

    if (params.siteIds?.length) {
      conditions.push(inArray(schema.SiteTable.id, params.siteIds));
    }

    if (params.query) {
      if (params.query.state) {
        conditions.push(eq(schema.SiteTable.state, params.query.state));
      }
      if (params.query.processStage) {
        conditions.push(
          eq(schema.SiteTable.processStage, params.query.processStage),
        );
      }
      if (params.query.search) {
        conditions.push(
          like(schema.CategoryTable.name, `%${params.query.search.search}%`),
        );
      }
    }

    if (conditions.length === 0) {
      throw new Error('params wrong');
    }

    return and(...conditions);
    // const query: FilterQuery<Site> = { $or: [] };
    // if (params.siteIds?.length) {
    //   query.$or.push({ _id: { $in: params.siteIds } });
    // }
    // if (params.query) {
    //   query.$or.push(params.query);
    // }
    // if (query.$or.length === 0) {
    //   throw new Error('params wrong');
    // }
    // return query;
  }

  async batchDispatchSiteCrawl(params: BatchParams) {
    const conditions = this.generateBatchQuery(params);
    console.log(params);
    const siteIds = await this.db.query.SiteTable.findMany({
      columns: {
        id: true,
      },
      where: conditions,
    });
    console.log(siteIds);
    await this.siteQueueProducer.batchAddCrawlJobs(
      siteIds.map((item) => item.id),
    );

    // const query = this.generateBatchQuery(params);

    // const siteIds = (await this.siteModel.distinct('_id', query)).map((id) =>
    //   id.toString(),
    // );
    // await this.siteQueueProducer.batchAddCrawlJobs(siteIds);
    // Logger.log(`Batch dispatch ${siteIds.length} sites crawl`);

    // await this.siteModel.updateMany(query, {
    //   $set: { processStage: ProcessStage.processing },
    // });
  }

  async test() {
    Logger.log('test!!');
    const sites = await this.db.query.CategoryTable.findMany();
    Logger.log(sites);
  }

  async batchStopSiteCrawl(params: BatchParams) {
    // const query = this.generateBatchQuery(params);
    // const siteIds = (await this.siteModel.distinct('_id', query)).map((id) =>
    //   id.toString(),
    // );
    // await this.siteQueueProducer.batchStopCrawlJob(siteIds);
    // Logger.log(`Batch stop ${siteIds.length} sites crawl`);
    // await this.siteModel.updateMany(query, {
    //   $set: { processStage: ProcessStage.pending },
    // });
  }
}
