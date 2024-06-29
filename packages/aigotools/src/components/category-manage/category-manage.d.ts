import { Prisma, Category } from "@prisma/client";

const categoryWithParent = Prisma.validator<Prisma.CategoryDefaultArgs>()({
  include: { parent: true },
});

export type CategoryWithParent = Prisma.CategoryGetPayload<
  typeof categoryWithParent
>;

// 定义兼容新增和编辑的联合类型
export type CategoryFormState = Prisma.CategoryUncheckedCreateInput &
  Partial<Prisma.CategoryUncheckedUpdateInput>;
