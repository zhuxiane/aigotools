import { Category } from "@prisma/client";

export interface CategoryWithParent extends Category {
  parent?: Prisma.CategoryGetPayload<{
    // 选择 parent 字段的特定属性
    select: {
      id: true;
      name: true;
    }
  }>;
}