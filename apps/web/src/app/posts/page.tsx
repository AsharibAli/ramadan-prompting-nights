"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts } from "@/api/posts.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestPostsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });
  const posts = (data ?? []) as Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <Card key={key}>
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading posts</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <p className="text-muted-foreground text-sm">
              Created: {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <p>{post.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
