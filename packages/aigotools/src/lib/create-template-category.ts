import { SelectCategory, InsertCategory } from "@/db/schema";

export const createTemplateCategory = (category: SelectCategory | {} = {}) => {
  const newCategory: InsertCategory = {
    name: "",
    icon: "",
    featured: false,
    weight: 0,
  };

  return {
    ...newCategory,
    ...category,
  } as InsertCategory;
};
