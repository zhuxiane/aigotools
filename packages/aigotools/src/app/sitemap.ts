import { MetadataRoute } from "next";

import db from "@/lib/db-connect";
import {
  SelectSite,
  InsertSite,
  InsertCategory,
  SiteTable,
  CategoryTable,
  Link,
  ReviewTable,
  UpvoteTable,
  SelectCategory,
} from "@/db/schema";
import {
  and,
  eq,
  ne,
  or,
  isNotNull,
  isNull,
  desc,
  asc,
  like,
  inArray,
} from "drizzle-orm/expressions";
import { sql, count } from "drizzle-orm";
import { SiteState } from "@/lib/constants";
import { AvailableLocales } from "@/lib/locales";
import { AppConfig } from "@/lib/config";

const perSitemapCount = 2000;

export async function generateSitemaps() {
  const siteCountResult = await db
    .select({ count: count() })
    .from(SiteTable)
    .where(eq(SiteTable.state, SiteState.published))
    .get();
  const siteCount = siteCountResult?.count || 0;
  const siteMapCount = Math.ceil(siteCount / perSitemapCount);

  const siteMapIds = new Array(siteMapCount).fill(0).map((_, id) => {
    return {
      id,
    };
  });

  return [{ id: -1 }, ...siteMapIds];
}

export default async function sitemap({ id }: { id: number }) {
  const sitemapRoutes: MetadataRoute.Sitemap = [];

  if (id === -1) {
    // base page sitemap
    sitemapRoutes.push(
      {
        url: "",
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1,
      },
      {
        url: "categories",
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: "search",
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: "submit",
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: "tos",
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.5,
      },
      {
        url: "privacy-policy",
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.5,
      },
    );
  } else {
    // sites page site map'
    const siteKeyObjs = await db
      .select({ siteKey: SiteTable.siteKey })
      .from(SiteTable)
      .where(eq(SiteTable.state, SiteState.published))
      .limit(perSitemapCount)
      .offset(id * perSitemapCount);

    sitemapRoutes.push(
      ...siteKeyObjs.map(({ siteKey }) => {
        return {
          url: `s/${siteKey}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.9,
        };
      }),
    );
  }

  const sitemapData = sitemapRoutes.flatMap((route) =>
    AvailableLocales.map((locale) => {
      return {
        ...route,
        url: [AppConfig.siteUrl, locale, route.url].filter(Boolean).join("/"),
      };
    }),
  );

  return sitemapData;
}
