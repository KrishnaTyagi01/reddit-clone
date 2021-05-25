import { _prod_ } from "./Constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  dbName: "reddit",
  type: "postgresql",
  password: "delhi110053gfps",
  debug: !_prod_,
} as Parameters<typeof MikroORM.init>[0];
