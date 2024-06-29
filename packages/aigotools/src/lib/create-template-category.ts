import { Prisma, Category } from "@prisma/client";

export const createTemplateCategory = (category: Partial<Category> = {}) => {
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
  };
};
