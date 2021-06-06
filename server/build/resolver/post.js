"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Post_1 = require("../entities/Post");
const Updoot_1 = require("../entities/Updoot");
const isAuth_1 = require("../middleware/isAuth");
let PostInput = class PostInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    type_graphql_1.InputType()
], PostInput);
let PaginatedPosts = class PaginatedPosts {
};
__decorate([
    type_graphql_1.Field(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginatedPosts.prototype, "posts", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Boolean)
], PaginatedPosts.prototype, "hasMore", void 0);
PaginatedPosts = __decorate([
    type_graphql_1.ObjectType()
], PaginatedPosts);
let PostResolver = class PostResolver {
    textSnippet(root) {
        return root.text.slice(0, 50);
    }
    async vote(postId, value, { req }) {
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const { userId } = req.session;
        console.log("Session on Vote resolver: ", req.session);
        const updoot = await Updoot_1.Updoot.findOne({ where: { postId, userId } });
        //User have voted on this post before and now he's changing it's value
        // eg updoot to downdoot
        if (updoot && updoot.value !== realValue) {
            await typeorm_1.getConnection().transaction(async (tm) => {
                await tm.query(`
          update updoot 
          set value = $1
          where "postId" = $2 and "userId" = $3
          `, [realValue, postId, userId]);
                await tm.query(`
          update post 
          set points = points + $1
          where id = $2
          `, [2 * realValue, postId]
                //2*realValue as we have to remove the first downdoot and add 1 for updoot and vice versa
                );
            });
        }
        else if (!updoot) {
            //user has never voted before
            await typeorm_1.getConnection().transaction(async (tm) => {
                await tm.query(`
        insert into updoot ("userId", "postId", "value")
        values ($1, $2, $3)
        `, [userId, postId, realValue]);
                await tm.query(`
          update post 
          set points = points + $1
          where id = $2
          `, [realValue, postId]);
            });
        }
        return true;
    }
    async posts(limit, cursor, { req }) {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const replacements = [realLimitPlusOne];
        if (req.session.userId) {
            replacements[1] = req.session.userId;
        }
        if (cursor) {
            replacements[2] = new Date(parseInt(cursor));
        }
        console.log(replacements);
        const posts = await typeorm_1.getConnection().query(`
    select p.*,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
    ) creator,
    ${req.session.userId
            ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus" '
            : 'null as "voteStatus" '}
    from post p
    inner join public.user u on u.id = p."creatorId"
    ${cursor ? `where p."createdAt" < $3` : ""}
    order by p."createdAt" DESC
    limit $1
    `, replacements);
        // const qb = getConnection()
        //   .getRepository(Post)
        //   .createQueryBuilder("p")
        //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
        //   .orderBy('p."createdAt"', "DESC")
        //   .take(realLimitPlusOne);
        // if (cursor) {
        //   qb.where('p."createdAt" < :cursor', {
        //     cursor: new Date(parseInt(cursor)),
        //   });
        // }
        // const allPost = await qb.getMany();
        // console.log("posts:", posts);
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length == realLimitPlusOne,
        };
    }
    post(id) {
        return Post_1.Post.findOne(id, { relations: ["creator"] });
    }
    async createPost(input, { req }) {
        //2 SQL queries
        return Post_1.Post.create(Object.assign(Object.assign({}, input), { creatorId: req.session.userId })).save();
    }
    async updatePost(id, title, text, { req }) {
        const result = await typeorm_1.getConnection()
            .createQueryBuilder()
            .update(Post_1.Post)
            .set({ title, text })
            .where('id = :id and "creatorId" = :creatorId', {
            id,
            creatorId: req.session.userId,
        })
            .returning("*")
            .execute();
        return result.raw[0];
    }
    async deletePost(id, { req }) {
        // not cascade way -> Deleting the updoots on a post if post is deleted
        // const post = await Post.findOne(id);
        // if (!post) {
        //   return false;
        // }
        // if (post.creatorId !== req.session.userId) {
        //   throw new Error("not authorized");
        // }
        // await Updoot.delete({ postId: id });
        // await Post.delete({ id });
        await Post_1.Post.delete({ id, creatorId: req.session.userId }); //user can only delete his own post
        return true;
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("postId", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("value", () => type_graphql_1.Int)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    type_graphql_1.Query(() => PaginatedPosts),
    __param(0, type_graphql_1.Arg("limit", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("cursor", () => String, { nullable: true })),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    type_graphql_1.Query(() => Post_1.Post, { nullable: true }),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("title", () => String)),
    __param(2, type_graphql_1.Arg("text", () => String)),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    type_graphql_1.Resolver(Post_1.Post) // It's optional
], PostResolver);
exports.PostResolver = PostResolver;
