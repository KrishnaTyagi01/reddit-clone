import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { Navbar } from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { useState } from "react";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return <div>Your query failed for some reason</div>;
  }

  return (
    <Layout>
      <Flex align="center">
        <Heading>Reddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">Create Post</Link>
        </NextLink>
      </Flex>

      <br />
      {fetching && !data ? (
        <div>Loading ...</div>
      ) : (
        <Stack spacing={8}>
          {data.posts.posts.map((p) => (
            <Box p={5} key={p.id} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            m="auto"
            my={8}
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
