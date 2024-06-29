import { Prisma, ProcessStage, SiteState, Site } from "@prisma/client";

export const createTemplateSite = (
  site: Partial<Prisma.SiteCreateInput> = {},
): Prisma.SiteCreateInput => {
  const newSite: Prisma.SiteCreateInput = {
    userId: "",
    url: "",
    siteKey: "",
    featured: false,
    weight: 0,
    name: "",
    snapshot: "",
    desceription: "",
    pricingType: "",
    categories: {
      connect: []
    },
    images: [],
    features: [],
    usecases: [],
    users: [],
    relatedSearchs: [],
    pricings: [],
    links: {},
    voteCount: 0,
    metaKeywords: [],
    metaDesceription: "",
    searchSuggestWords: [],
    state: SiteState.unpublished,
    createdAt: new Date(),
    updatedAt: new Date(),
    processStage: ProcessStage.pending,
  };

  return { ...newSite, ...site } as Site;
};
