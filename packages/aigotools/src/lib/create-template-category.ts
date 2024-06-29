import { Prisma, Category } from "@prisma/client";
import {
  CategoryFormState,
  CategoryWithParent,
} from "@/components/category-manage/category-manage";

export const createTemplateCategory = (
  category: Partial<CategoryWithParent> = {},
) => {
  const newCategory: Prisma.CategoryCreateInput = {
    name: "",
    icon: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false,
    weight: 0,
  };

  return {
    ...newCategory,
    ...category,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CategoryWithParent;
};
