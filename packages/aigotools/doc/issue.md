在 Prisma 模型定义中无法直接指定全文索引，因此需要在应用程序初始化时使用 Prisma 客户端创建索引。可以在应用程序启动时或在迁移脚本中执行此操作。

```
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createFullTextIndex() {
  await prisma.$runCommandRaw({
    createIndexes: "sites",
    indexes: [
      {
        key: {
          url: "text",
          name: "text",
          desceription: "text",
          categoryIds: "text",
          features: "text",
          usecases: "text",
          users: "text",
          relatedSearchs: "text"
        },
        name: "fulltext_search_index",
      }
    ]
  });
}

createFullTextIndex()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
```
