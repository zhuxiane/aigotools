import { InsertSite, SelectSite } from "@/db/schema";

import { ProcessStage, SiteState } from "./constants";

export const createTemplateSite = (site: SelectSite | {} = {}) => {
  const newSite: InsertSite = {
    userId: "",
    url: "",
    siteKey: "",
    featured: false,
    weight: 0,
    name: "",
    snapshot: "",
    description: "",
    pricingType: "",
    categories: [],
    images: [],
    features: [],
    usecases: [],
    users: [],
    relatedSearches: [],
    pricings: [],
    links: {},
    voteCount: 0,
    metaKeywords: [],
    metaDescription: "",
    searchSuggestWords: [],
    state: SiteState.unpublished,
    processStage: ProcessStage.pending,
  };

  return { ...newSite, ...site } as InsertSite;
};
