"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv").config();
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Constants_1 = require("./Constants");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const hello_1 = require("./resolver/hello");
const post_1 = require("./resolver/post");
const user_1 = require("./resolver/user");
const path_1 = __importDefault(require("path"));
const main = async () => {
    const conn = await typeorm_1.createConnection({
        type: "postgres",
        database: "reddit2",
        username: "postgres",
        password: process.env.DATABASE_PASSWORD,
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
        entities: [Post_1.Post, User_1.User],
    });
    // await conn.runMigrations();
    const app = express_1.default();
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = ioredis_1.default();
    app.use(cors_1.default({
        origin: "http://localhost:3000",
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: Constants_1.COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: "lax",
            secure: Constants_1._prod_, //cookie only works in https (here in production only)
        },
        saveUninitialized: false,
        secret: "abegiobgdkvdlggaebgaebzgb",
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await type_graphql_1.buildSchema({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res, redis }),
    });
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });
    app.listen(4000, () => {
        console.log("The server started on port 4000");
    });
};
main().catch((err) => {
    console.error(err);
});
