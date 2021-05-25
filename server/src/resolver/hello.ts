import { Query, Resolver } from "type-graphql";

@Resolver() // It's optional
export class HelloResolver {
  @Query(() => String)
  hello() {
    return "Hello there";
  }
  @Query(() => String)
  bye() {
    return "Bye bYe";
  }
}
