"use server";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
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
import db from "@/lib/db-connect";

import { ProcessStage, ReviewState, SiteState } from "./constants";
import { AppConfig } from "./config";
import { createTemplateSite } from "./create-template-site";
import { UpvoteType } from "@/lib/constants";

function pickCategoryName(site: SelectSite, categories: SelectCategory[]) {
  const cates: string[] = [];
  site.categories?.forEach((id) => {
    const index = categories.findIndex((item) => item.id === Number(id));
    if (index > -1) {
      cates.push(categories[index].name);
    }
  });

  return {
    ...site,
    categories: cates,
  };
}

async function assertIsManager() {
  // const user = await currentUser();

  return { id: "1" };
  // const isManager = user?.id && AppConfig.manageUsers.includes(user.id);

  // if (!isManager) {
  //   throw new Error("User not manager");
  // }

  // return user;
}

export async function searchSites({
  search,
  page,
  category,
}: {
  search: string;
  category: string;
  page: number;
}) {
  try {
    const pageSize = 24;
    let categoryId: number | undefined;

    if (category) {
      const categoryResult = await db
        .select({ id: CategoryTable.id })
        .from(CategoryTable)
        .where(eq(CategoryTable.name, category))
        .get();

      categoryId = categoryResult?.id;
    }

    const categoryIdString = String(categoryId);

    const query = and(
      eq(SiteTable.state, SiteState.published),
      search
        ? or(
            like(SiteTable.name, `%${search}%`),
            like(SiteTable.siteKey, `%${search}%`),
          )
        : undefined,
      categoryId
        ? sql`${SiteTable.categories} LIKE ${'%"' + categoryIdString + '"%'}`
        : undefined,
    );

    // 当前不支持正则搜索
    // const regFindSites = search
    //   ? await db
    //       .select()
    //       .from(SiteTable)
    //       .where(
    //         and(
    //           eq(SiteTable.state, SiteState.published),
    //           or(
    //             like(SiteTable.name, `%${search}%`),
    //             like(SiteTable.siteKey, `%${search}%`),
    //           ),
    //         ),
    //       )
    //       .orderBy(desc(SiteTable.weight), desc(SiteTable.updatedAt))
    //       .limit(12)
    //   : [];

    const baseFindTask = db
      .select()
      .from(SiteTable)
      .where(query)
      .orderBy((desc(SiteTable.weight), desc(SiteTable.updatedAt)))
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    const countTask = db
      .select({ count: count() })
      .from(SiteTable)
      .where(query)
      .get();

    const [sites, countResult] = await Promise.all([baseFindTask, countTask]);
    const categories = await getFeaturedCategories();

    return {
      page,
      // sites: [...(page === 1 ? regFindSites : []), ...sites],
      sites: sites.map((site) => pickCategoryName(site, categories)),
      hasNext: countResult?.count || 0 > page * pageSize,
    };
  } catch (error) {
    console.log("Search sites error", error);

    throw error;
  }
}

export interface SearchParams {
  state?: SiteState;
  category?: string;
  processStage?: ProcessStage;
  search?: string;
  page: number;
  size: number;
}

function generateSiteFilterQuery(data: SearchParams) {
  const conditions: any[] = [];

  if (data.search) {
    conditions.push(like(SiteTable.name, `%${data.search}%`));
  }
  if (data.state) {
    conditions.push(eq(SiteTable.state, data.state));
  }
  if (data.processStage) {
    conditions.push(eq(SiteTable.processStage, data.processStage));
  }
  if (data.category) {
    const categoryStr = `"${data.category}"`; // 将 category 转换为字符串格式
    conditions.push(
      sql`${SiteTable.categories} LIKE ${"%" + categoryStr + "%"}`,
    );
  }

  return and(...conditions);
}

export async function managerSearchSites(data: SearchParams) {
  try {
    await assertIsManager();

    const query = generateSiteFilterQuery(data);

    const offset = (data.page - 1) * data.size;
    const limit = data.size;

    // Fetching sites
    const sites = await db
      .select()
      .from(SiteTable)
      .where(query)
      .orderBy(desc(SiteTable.updatedAt))
      .offset(offset)
      .limit(limit)
      .all();

    // Fetching count
    const countResult = await db
      .select({ count: count() })
      .from(SiteTable)
      .where(query)
      .get();

    return {
      sites,
      count: countResult?.count || 0,
      totalPage: Math.ceil(countResult?.count || 0 / data.size),
    };
  } catch (error) {
    console.log("Search sites error", error);

    throw error;
  }
}

export async function getFeaturedSites(size = 12) {
  try {
    const sites = await db
      .select()
      .from(SiteTable)
      .where(
        and(
          eq(SiteTable.featured, true),
          eq(SiteTable.state, SiteState.published),
        ),
      )
      .orderBy(desc(SiteTable.weight), desc(SiteTable.updatedAt))
      .limit(size);

    const categories = await getFeaturedCategories();

    return sites.map((site) => pickCategoryName(site, categories));
  } catch (error) {
    console.log("Get featured sites", error);

    return [];
  }
}

export async function getLatestSites(size = 12) {
  try {
    const sites = await db
      .select()
      .from(SiteTable)
      .where(
        and(
          eq(SiteTable.featured, true),
          eq(SiteTable.state, SiteState.published),
        ),
      )
      .orderBy(desc(SiteTable.updatedAt))
      .limit(size);

    const categories = await getFeaturedCategories();

    return sites.map((site) => pickCategoryName(site, categories));
  } catch (error) {
    console.log("Get latest sites", error);

    return [];
  }
}

export async function submitReview(name: string, url: string) {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not signed");
    }

    await db.insert(ReviewTable).values({
      name,
      url,
      userId: user.id,
      userEmail: user.primaryEmailAddress?.emailAddress || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // await dbConnect();

    // await ReviewModel.create({
    //   name,
    //   url,
    //   userId: user.id,
    //   userEmail: user.primaryEmailAddress?.emailAddress,
    // });

    return true;
  } catch (error) {
    console.log("Submit review error", error);
  }

  return false;
}

export async function getSiteMetadata(siteKey: string) {
  try {
    const site = await db
      .select()
      .from(SiteTable)
      .where(
        and(
          eq(SiteTable.siteKey, siteKey),
          eq(SiteTable.state, SiteState.published),
        ),
      )
      .get();

    if (!site) {
      return null;
    }

    return {
      title: site.name,
      description: site.metaDescription || site.description,
      keywords: site.metaKeywords,
    };
  } catch (error) {
    console.log("Get site metadata error", error);
  }

  return null;
}

export async function getSiteDetailByKey(siteKey: string) {
  try {
    const site = await db
      .select()
      .from(SiteTable)
      .where(
        and(eq(SiteTable.siteKey, siteKey), eq(SiteTable.state, "published")),
      )
      .get();

    if (!site) {
      return null;
    }

    const conditions = [];
    if (site.categories?.length) {
      for (let category of site.categories) {
        conditions.push(like(SiteTable.categories, '%"' + category + '"%'));
      }
    }

    const suggests = await db
      .select()
      .from(SiteTable)
      .where(
        and(
          or(...conditions),
          ne(SiteTable.id, site.id),
          eq(SiteTable.state, "published"),
        ),
      )
      .limit(12);

    let categoryNames: { name: string }[] = [];
    // category转换为name
    if (site.categories?.length) {
      const categoryIds = site.categories?.map((item) => Number(item));
      categoryNames = await db
        .select({ name: CategoryTable.name })
        .from(CategoryTable)
        .where(inArray(CategoryTable.id, categoryIds));
    }

    return {
      site: {
        ...site,
        categories: categoryNames.map((item) => item.name),
      },
      suggests: suggests,
    };
    // await dbConnect();
    // const site = await SiteModel.findOne({
    //   siteKey,
    //   state: SiteState.published,
    // }).populate("categories");
    // if (!site) {
    //   return null;
    // }
    // const suggests = await SiteModel.find(
    //   {
    //     $text: { $search: site.description },
    //     _id: { $ne: site._id },
    //     state: SiteState.published,
    //   },
    //   { score: { $meta: "textScore" } },
    // )
    //   .sort({ score: { $meta: "textScore" } })
    //   .limit(12)
    //   .populate("categories");
    // return {
    //   site: pickCategoryName(siteToObject(site)),
    //   suggests: suggests.map(siteToObject).map(pickCategoryName),
    // };
  } catch (error) {
    console.log("Get site detail error", error);
  }

  return null;
}

export async function triggerUpvoteSite(siteId: number) {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not signed");
    }

    const site = await db
      .select({ id: SiteTable.id, voteCount: SiteTable.voteCount })
      .from(SiteTable)
      .where(
        and(eq(SiteTable.id, siteId), eq(SiteTable.state, SiteState.published)),
      )
      .get();

    if (!site) {
      throw new Error("Site is null");
    }

    const upvoted = await db
      .select()
      .from(UpvoteTable)
      .where(
        and(
          eq(UpvoteTable.userId, user.id),
          eq(UpvoteTable.targetId, siteId),
          eq(UpvoteTable.upvoteType, UpvoteType.site),
        ),
      )
      .get();

    if (upvoted) {
      await db.delete(UpvoteTable).where(eq(UpvoteTable.id, upvoted.id));
    } else {
      await db.insert(UpvoteTable).values({
        userId: user.id,
        targetId: siteId,
        upvoteType: UpvoteType.site,
      });
    }

    const voteCount = await db
      .select({ count: count() })
      .from(UpvoteTable)
      .where(
        and(
          eq(UpvoteTable.targetId, siteId),
          eq(UpvoteTable.upvoteType, UpvoteType.site),
        ),
      )
      .get();

    await db
      .update(SiteTable)
      .set({
        voteCount: voteCount?.count,
      })
      .where(eq(SiteTable.id, site.id));
    return { upvoted: !upvoted, count: voteCount?.count || null };

    // await dbConnect();

    // const site = await SiteModel.findOne({
    //   _id: siteId,
    //   state: SiteState.published,
    // });

    // if (!site) {
    //   throw new Error("Site is null");
    // }

    // const upvoted = await UpvoteModel.exists({
    //   userId: user.id,
    //   targetId: siteId,
    //   upvoteType: UpvoteType.site,
    // });

    // if (upvoted) {
    //   await UpvoteModel.findByIdAndDelete(upvoted._id);
    // } else {
    //   await UpvoteModel.create({
    //     userId: user.id,
    //     targetId: siteId,
    //     upvoteType: UpvoteType.site,
    //   });
    // }
    // site.voteCount = await UpvoteModel.countDocuments({
    //   targetId: siteId,
    //   upvoteType: UpvoteType.site,
    // });
    // await site.save();

    // return { upvoted: !upvoted, count: site.voteCount };
  } catch (error) {
    console.log("Upvote site error", error);
    throw error;
  }
}

export async function isUserUpVoteSite(siteId: number) {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not signed");
    }

    const upvoded = await db
      .select({ count: count() })
      .from(UpvoteTable)
      .where(
        and(
          eq(UpvoteTable.targetId, siteId),
          eq(UpvoteTable.userId, user.id),
          eq(UpvoteTable.upvoteType, UpvoteType.site),
        ),
      )
      .get();

    return !!upvoded?.count;

    // await dbConnect();

    // const existed = await UpvoteModel.exists({
    //   targetId: siteId,
    //   userId: user.id,
    //   upvoteType: UpvoteType.site,
    // });

    // return !!existed;
  } catch (error) {
    console.log("Is user upvote site error", error);
  }

  return false;
}

export async function saveSite(site: InsertSite) {
  try {
    const user = await assertIsManager();

    const urlObj = new URL(site.url);
    site.url = urlObj.origin;
    site.siteKey = urlObj.hostname.replace(/[^\w]/g, "_");

    let saved;

    if (site.id) {
      saved = await db
        .update(SiteTable)
        .set({
          ...site,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(SiteTable.id, site.id))
        .returning();

      saved = saved[0]; // 由于返回的是数组，取第一个元素
    } else {
      site.userId = user.id;

      // 创建新站点
      saved = await db
        .insert(SiteTable)
        .values({
          ...site,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      saved = saved[0]; // 由于返回的是数组，取第一个元素
    }

    return saved;

    // await dbConnect();

    // const urlObj = new URL(site.url);

    // site.url = urlObj.origin;
    // site.updatedAt = Date.now();
    // site.siteKey = urlObj.hostname.replace(/[^\w]/g, "_");

    // let saved: SiteDocument;

    // if (site._id) {
    //   saved = (await SiteModel.findByIdAndUpdate(
    //     site._id,
    //     { $set: site },
    //     { returnDocument: "after" },
    //   )) as any;
    // } else {
    //   site.userId = user.id;

    //   saved = await SiteModel.create(site);
    // }

    // saved.categories = saved.categories.map((c) => c.toString());

    // return siteToObject(saved);
  } catch (error) {
    console.log("Save site error", error);
  }

  return null;
}

export async function triggerSitePublish(site: SelectSite) {
  try {
    await assertIsManager();

    if (site.state === SiteState.published) {
      await db
        .update(SiteTable)
        .set({
          state: SiteState.unpublished,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(SiteTable.id, site.id));
    } else {
      await db
        .update(SiteTable)
        .set({
          state: SiteState.published,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(SiteTable.id, site.id));
    }
    // await dbConnect();

    // if (site.state === SiteState.published) {
    //   await SiteModel.findByIdAndUpdate(site._id, {
    //     $set: { state: SiteState.unpublished, updatedAt: Date.now() },
    //   });
    // } else {
    //   await SiteModel.findByIdAndUpdate(site._id, {
    //     $set: { state: SiteState.published, updatedAt: Date.now() },
    //   });
    // }

    return true;
  } catch (error) {
    console.log("trigger site publish error", error);
  }

  return false;
}

export async function managerSearchReviews(data: {
  page: number;
  size: number;
  search?: string;
  state?: ReviewState;
}) {
  try {
    await assertIsManager();

    const conditions = [];

    if (data.search) {
      conditions.push(like(ReviewTable.name, `%${data.search}%`));
    }
    if (data.state) {
      conditions.push(eq(ReviewTable.state, data.state));
    }

    const [reviews, countResult] = await db.batch([
      db
        .select()
        .from(ReviewTable)
        .where(and(...conditions))
        .orderBy(sql`${ReviewTable.updatedAt} DESC`)
        .limit(data.size)
        .offset((data.page - 1) * data.size),

      db
        .select({ count: count() })
        .from(ReviewTable)
        .where(and(...conditions)),
    ]);

    return {
      reviews,
      count: countResult[0].count,
      totalPage: Math.ceil(countResult[0].count / data.size),
    };
    // await dbConnect();

    // const query: FilterQuery<SiteDocument> = {};

    // if (data.search) {
    //   query.$text = { $search: data.search };
    // }
    // if (data.state) {
    //   query.state = data.state;
    // }

    // const [reviews, count] = await Promise.all([
    //   ReviewModel.find(query)
    //     .sort({ updatedAt: -1 })
    //     .skip((data.page - 1) * data.size)
    //     .limit(data.size),
    //   ReviewModel.countDocuments(query),
    // ]);

    // return {
    //   reviews: reviews.map(reviewToObject),
    //   count,
    //   totalPage: Math.ceil(count / data.size),
    // };
  } catch (error) {
    console.log("Search reviews error", error);

    // throw error;
    return {
      reviews: [],
      count: 0,
      totalPage: 0,
    };
  }
}

export async function deleteSite(siteId: number) {
  try {
    await assertIsManager();

    await db.delete(SiteTable).where(eq(SiteTable.id, siteId));

    // await SiteModel.findByIdAndDelete(siteId);
  } catch (error) {
    console.log("Delete site error", error);
    throw error;
  }
}

export async function updateReviewState(reviewId: number, state: ReviewState) {
  try {
    const user = await assertIsManager();

    const review = await db
      .select()
      .from(ReviewTable)
      .where(eq(ReviewTable.id, reviewId))
      .get();

    if (!review) {
      throw new Error("Review not exist");
    }

    if (state === ReviewState.approved) {
      const site = await saveSite(
        createTemplateSite({
          userId: user.id,
          name: review.name,
          url: review.url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );

      if (site) {
        await dispatchSiteCrawl(site.id);
      } else {
        throw new Error("Save site error");
      }
    }

    await db
      .update(ReviewTable)
      .set({
        state,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ReviewTable.id, reviewId));

    // await dbConnect();

    // const review = await ReviewModel.findById(reviewId);

    // if (!review) {
    //   throw new Error("Review not exist");
    // }

    // if (state === ReviewState.approved) {
    //   const site = await saveSite(
    //     createTemplateSite({
    //       userId: user.id,
    //       name: review.name,
    //       url: review.url,
    //     }),
    //   );

    //   if (site) {
    //     await dispatchSiteCrawl(site._id.toString());
    //   } else {
    //     throw new Error("Save site error");
    //   }
    // }

    // review.state = state;
    // review.updatedAt = Date.now();
    // await review.save();
  } catch (error) {
    console.log("Update review state error", error);
    throw error;
  }
}

export async function dispatchSiteCrawl(siteId: number) {
  try {
    await assertIsManager();

    await axios.post(
      `${AppConfig.crawlerGateway}/dispatch`,
      { siteIds: [siteId] },
      {
        headers: {
          Authorization: `Basic ${AppConfig.crawlerAuthToken}`,
        },
      },
    );
  } catch (error) {
    console.log("Dispatch site crawl error", error);
    throw error;
  }
}

export async function stopSiteCrawl(siteId: number) {
  try {
    await assertIsManager();

    await axios.post(
      `${AppConfig.crawlerGateway}/stop?site=${siteId}`,
      { siteIds: [siteId] },
      {
        headers: {
          Authorization: `Basic ${AppConfig.crawlerAuthToken}`,
        },
      },
    );
  } catch (error) {
    console.log("Stop site crawl error", error);
    throw error;
  }
}

export async function dispatchAllSitesCrawl(
  data: Omit<SearchParams, "page" | "size">,
) {
  try {
    await assertIsManager();

    await axios.post(
      `${AppConfig.crawlerGateway}/dispatch`,
      { query: data },
      {
        headers: {
          Authorization: `Basic ${AppConfig.crawlerAuthToken}`,
        },
      },
    );
  } catch (error) {
    console.log("Dispatch site crawl error", error);
    throw error;
  }
}

export async function stopAllSitesCrawl(
  data: Omit<SearchParams, "page" | "size">,
) {
  try {
    await assertIsManager();

    await axios.post(
      `${AppConfig.crawlerGateway}/stop`,
      { query: data },
      {
        headers: {
          Authorization: `Basic ${AppConfig.crawlerAuthToken}`,
        },
      },
    );
  } catch (error) {
    console.log("Dispatch site crawl error", error);
    throw error;
  }
}

/** Category */
export async function saveCategory(category: InsertCategory) {
  try {
    await assertIsManager();

    if (category.id) {
      await db
        .update(CategoryTable)
        .set({ ...category, updatedAt: new Date().toISOString() })
        .where(eq(CategoryTable.id, category.id));
    } else {
      await db.insert(CategoryTable).values({
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // await dbConnect();

    // if (category._id) {
    //   category.updatedAt = Date.now();
    //   await CategoryModel.findByIdAndUpdate(category._id, { $set: category });
    // } else {
    //   await CategoryModel.create(category);
    // }
  } catch (error) {
    console.log("Dispatch site crawl error", error);
    throw error;
  }
}

export async function deleteCategory(id: number) {
  try {
    await assertIsManager();
    await db.delete(CategoryTable).where(eq(CategoryTable.id, id));

    // 从site表中删除对应的category
    // 查询包含特定 categoryId 的记录
    const categoryIdToRemove = String(id);

    const records = await db
      .select()
      .from(SiteTable)
      .where(
        sql`${SiteTable.categories} LIKE ${'%"' + categoryIdToRemove + '"%'}`,
      );

    for (const record of records) {
      if (record.categories) {
        // 删除特定的 categoryId
        const categories = record.categories.filter(
          (categoryId) => categoryId !== categoryIdToRemove,
        );

        // 更新数据库中的记录
        await db
          .update(SiteTable)
          .set({ categories })
          .where(eq(SiteTable.id, record.id));
      }
    }

    await db.delete(CategoryTable).where(eq(CategoryTable.parent, id));

    // await dbConnect();

    // await CategoryModel.findByIdAndDelete(id);
    // await SiteModel.updateMany(
    //   {
    //     categories: id,
    //   },
    //   {
    //     $pull: { categories: id },
    //   },
    // );
    // await CategoryModel.deleteMany({ parent: id });
  } catch (error) {
    console.log("Dispatch site crawl error", error);
    throw error;
  }
}

export interface CategorySearchForm {
  page: number;
  size: number;
  search?: string;
  parent?: string;
  type?: "top" | "second";
}

export async function managerSearchCategories(data: CategorySearchForm) {
  try {
    await assertIsManager();
    // 创建查询条件
    const conditions = [];

    if (data.search) {
      conditions.push(like(CategoryTable.name, `%${data.search}%`));
    }
    if (data.parent) {
      conditions.push(eq(CategoryTable.parent, Number(data.parent)));
    }
    if (data.type === "top") {
      conditions.push(isNull(CategoryTable.parent));
    } else if (data.type === "second" && !data.parent) {
      conditions.push(isNotNull(CategoryTable.parent));
    }

    // 分页和排序查询
    const [categories, countResult] = await db.batch([
      db
        .select()
        .from(CategoryTable)
        .where(and(...conditions))
        .orderBy(sql`${CategoryTable.updatedAt} DESC`)
        .limit(data.size)
        .offset((data.page - 1) * data.size),

      db
        .select({ count: count() })
        .from(CategoryTable)
        .where(and(...conditions)),
    ]);

    return {
      categories,
      count: countResult[0].count,
      totalPage: Math.ceil(countResult[0].count / data.size),
    };

    // await dbConnect();

    // const query: FilterQuery<Category> = {};

    // if (data.search) {
    //   query.name = { $regex: data.search, $options: "i" };
    // }
    // if (data.parent) {
    //   query.parent = data.parent;
    // }
    // if (data.type === "top") {
    //   query.parent = null;
    // } else if (data.type == "second" && !data.parent) {
    //   query.parent = { $exists: true };
    // }

    // const [categories, count] = await Promise.all([
    //   CategoryModel.find(query)
    //     .sort({ updatedAt: -1 })
    //     .skip((data.page - 1) * data.size)
    //     .limit(data.size),
    //   CategoryModel.countDocuments(query),
    // ]);

    // return {
    //   categories: categories.map(categoryToObject),
    //   count,
    //   totalPage: Math.ceil(count / data.size),
    // };
  } catch (error) {
    console.log("Search categories error", error);

    throw error;
  }
}

export async function getFeaturedCategories() {
  try {
    const categories = await db
      .select()
      .from(CategoryTable)
      .where(
        and(eq(CategoryTable.featured, true), isNotNull(CategoryTable.parent)),
      )
      .orderBy(desc(CategoryTable.weight), desc(CategoryTable.updatedAt));
    return categories;
    // await dbConnect();
    // const categories = await CategoryModel.find({
    //   featured: true,
    //   parent: { $exists: true },
    // }).sort({ weight: -1, updatedAt: -1 });
    // return categories.map(categoryToObject);
  } catch (error) {
    console.log("Get featured categories", error);

    throw error;
  }
}

export async function getAllCategories() {
  try {
    const categories = await db
      .select()
      .from(CategoryTable)
      .orderBy(asc(CategoryTable.weight), asc(CategoryTable.name));
    const topCategories = categories.filter((cate) => !cate.parent);
    const secondaryCategories = categories.filter((cate) => !!cate.parent);
    const grouped = topCategories.map((category) => {
      const children = secondaryCategories.filter(
        (sec) => sec.parent === category.id,
      );
      return {
        ...category,
        children,
      };
    });

    return grouped.filter((c) => c.children.length);
    // await dbConnect();
    // const categories = await CategoryModel.find({}).sort({
    //   weight: 1,
    //   name: 1,
    // });
    // const plainCategories = categories.map(categoryToObject);
    // const topCategories = plainCategories.filter((cate) => !cate.parent);
    // const secondaryCategories = plainCategories.filter((cate) => !!cate.parent);
    // const grouped = topCategories.map((category) => {
    //   (category as any).children = secondaryCategories.filter(
    //     (sec) => sec.parent === category._id,
    //   );
    //   return category;
    // }) as Array<
    //   Category & {
    //     children: Array<Category>;
    //   }
    // >;
    // return grouped.filter((c) => c.children.length);
  } catch (error) {
    console.log("Get all cateogry error", error);
    throw error;
  }
}
