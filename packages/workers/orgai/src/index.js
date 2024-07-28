// worker.js
import { Redis } from '@upstash/redis/cloudflare';

const redis = Redis.fromEnv();

export const SITE_CRAWL_JOB = 'site-crawl';
const API_KEY = 'orgai_api_key_PISJERJNSJC';

addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	const requestApiKey = request.headers.get('Authorization');

	if (requestApiKey !== API_KEY) {
		return new Response('Unauthorized', { status: 401 });
	}

	const url = new URL(request.url);
	const siteQueueProducer = new SiteQueueProducer();

	if (url.pathname === '/dispatch' && request.method === 'POST') {
		const { siteIds } = await request.json();
		await siteQueueProducer.batchAddCrawlJobs(siteIds);
		return new Response('Job added', { status: 201 });
	}

	if (url.pathname === '/stop' && request.method === 'POST') {
		const { siteIds } = await request.json();
		await siteQueueProducer.batchStopCrawlJob(siteIds);
		return new Response('Job stopped', { status: 200 });
	}

	return new Response('Not found', { status: 404 });
}

class SiteQueueProducer {
	async batchAddCrawlJobs(siteIds) {
		const pipeline = redis.pipeline();
		siteIds.forEach((siteId) => {
			pipeline.lpush(SITE_CRAWL_JOB, siteId);
		});
		await pipeline.exec();
	}

	async batchStopCrawlJob(siteIds) {
		const queue = await redis.lrange(SITE_CRAWL_JOB, 0, -1);
		const siteJobs = queue.filter((job) => siteIds.includes(job));
		for (const job of siteJobs) {
			await redis.lrem(SITE_CRAWL_JOB, 1, job);
		}
	}
}
