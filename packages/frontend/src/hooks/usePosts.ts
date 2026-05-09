import { useQuery } from "@tanstack/react-query";
import { postApi } from "@/api/post";
import { postKeys } from "@/api/queryKeys";

/**
 * Hook to fetch all posts
 */
export function usePosts() {
  return useQuery({
    queryKey: postKeys.all,
    queryFn: postApi.getAll,
  });
}

/**
 * Hook to fetch a single post by ID
 */
export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch posts by team ID
 */
export function usePostsByTeam(teamId: number) {
  return useQuery({
    queryKey: postKeys.byTeam(teamId),
    queryFn: () => postApi.getByTeam(teamId),
    enabled: !!teamId,
  });
}
