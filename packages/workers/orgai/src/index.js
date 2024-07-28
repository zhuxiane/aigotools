// worker.js
import { Redis } from '@upstash/redis/cloudflare';

const redis = Redis.fromEnv();

export const SITE_CRAWL_JOB = 'site-crawl';

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	const url = new URL(request.url);
	const siteQueueProducer = new SiteQueueProducer();

	if (url.pathname === '/add-crawl-job' && request.method === 'POST') {
		const { siteId } = await request.json();
		await siteQueueProducer.addCrawlJob(siteId);
		return new Response('Job added', { status: 201 });
	}

	if (url.pathname === '/batch-add-crawl-jobs' && request.method === 'POST') {
		const { siteIds } = await request.json();
		await siteQueueProducer.batchAddCrawlJobs(siteIds);
		return new Response('Jobs added', { status: 201 });
	}

	if (url.pathname === '/stop-crawl-job' && request.method === 'POST') {
		const { siteId } = await request.json();
		await siteQueueProducer.stopCrawlJob(siteId);
		return new Response('Job stopped', { status: 200 });
	}

	if (url.pathname === '/batch-stop-crawl-jobs' && request.method === 'POST') {
		const { siteIds } = await request.json();
		await siteQueueProducer.batchStopCrawlJob(siteIds);
		return new Response('Jobs stopped', { status: 200 });
	}

	return new Response('Not found', { status: 404 });
}

class SiteQueueProducer {
	async addCrawlJob(siteId) {
		await redis.lpush(SITE_CRAWL_JOB, siteId);
	}

	async batchAddCrawlJobs(siteIds) {
		const pipeline = redis.pipeline();
		siteIds.forEach(siteId => {
			pipeline.lpush(SITE_CRAWL_JOB, siteId);
		});
		await pipeline.exec();
	}

	async stopCrawlJob(siteId) {
		const queue = await redis.lrange(SITE_CRAWL_JOB, 0, -1);
		const siteJobs = queue.filter((job) => job === siteId);
		for (const job of siteJobs) {
			await redis.lrem(SITE_CRAWL_JOB, 1, job);
		}
	}

	async batchStopCrawlJob(siteIds) {
		const queue = await redis.lrange(SITE_CRAWL_JOB, 0, -1);
		const siteJobs = queue.filter((job) => siteIds.includes(job));
		for (const job of siteJobs) {
			await redis.lrem(SITE_CRAWL_JOB, 1, job);
		}
	}
}
