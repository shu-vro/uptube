> This is my lab, not the actual video.

1. init: `bunx prisma init --datasource-provider postgresql`
2. migrate: `bunx prisma migrate dev --name init`
3. migrate prod: `bunx prisma migrate deploy`
4. introspect: `bunx prisma db pull`
5. generate: `bunx prisma generate`

### Data types

- String
- Int
- Float
- Boolean
- DateTime
- Json
- Bytes
- Decimal
- BigInt

### Relations

- One-to-One
  - User <-> Preferences
- One-to-Many
  - User <-> Posts
- Many-to-Many
  - Posts <-> Categories

#### Examples

```prisma
model User {
    id          String       @id @default(cuid())
    email       String       @unique
    age         Int
    name        String
    posts       Post[]       @relation("UserPosts") // One-to-Many: User -> Posts
    preferences Preferences? @relation("UserPreferences") // One-to-One: User <-> Preferences

    @@map("users") // Block-level attribute: maps model to "users" table
    @@index([email, age]) // Block-level attribute: composite index
}

model Preferences {
    id     String  @id @default(cuid())
    theme  String
    user   User    @relation("UserPreferences", fields: [userId], references: [id])
    userId String  @unique

    @@map("preferences") // Block-level attribute
}

model Post {
    id         String      @id @default(cuid())
    title      String
    content    String
    published  Boolean     @default(false)
    author     User        @relation("UserPosts", fields: [authorId], references: [id])
    authorId   String
    categories Category[]  @relation("PostCategories") // Many-to-Many: Posts <-> Categories

    @@index([published, authorId]) // Block-level attribute: composite index
    @@map("posts")
}

model Category {
    id    String   @id @default(cuid())
    name  String
    posts Post[]   @relation("PostCategories")

    @@unique([name]) // Block-level attribute: unique constraint
    @@map("categories")
}
```

### Client Example (with output):

> Outputs are modified by ai

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);
  /*
  Output:
  [
      {
          id: '...',
          email: '...',
          age: 30,
          name: 'John Doe',
          posts: [Array],
          preferences: [Object]
      },
  ...
  ]
  */
  const newUser = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      age: 30,
      name: "John Doe",
      posts: {
        create: [
          {
            title: "Hello World",
            content: "This is my first post!",
          },
        ],
      },
      preferences: {
        create: {
          theme: "dark",
        },
      },
    },
  });
  /*
    Output:
    {
        id: '...',
        email: 'john.doe@example.com',
        age: 30,
        name: 'John Doe',
        posts: [
            {
                id: '...',
                title: 'Hello World',
                content: 'This is my first post!',
                published: false,
                authorId: '...'
            }
        ],
        preferences: {
            id: '...',
            theme: 'dark',
            userId: '...'
        }
    }
    */
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Reference

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma GitHub Repository](https://github.com/prisma/prisma)
- [Wds youtube video](https://www.youtube.com/watch?v=RebA5J-rlwg)

#### Local Damage Control

```bash
mkdir -p prisma/migrations/0_init && \
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

npx prisma migrate resolve --applied 0_init
```
