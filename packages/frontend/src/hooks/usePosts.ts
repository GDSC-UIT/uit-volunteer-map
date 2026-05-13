import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post, Photo } from "@uit-volunteer-map/shared";
import { postApi } from "@/api/post";
import { postKeys } from "@/api/queryKeys";
import { useAuth } from "@/hooks/useAuth";

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

/**
 * Hook to create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: Partial<Post>) => {
      if (!token) throw new Error("Unauthorized");
      return postApi.create(payload, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to update an existing post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Post> }) => {
      if (!token) throw new Error("Unauthorized");
      return postApi.update(id, payload, token);
    },
    onSuccess: (res, { id }) => {
      if (!res.success) return;
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      if (!token) throw new Error("Unauthorized");
      return postApi.delete(id, token);
    },
    onSuccess: (res, id) => {
      if (!res.success) return;
      void queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to add a photo to a post
 */
export function useAddPhoto() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: Partial<Photo> }) => {
      if (!token) throw new Error("Unauthorized");
      return postApi.addPhoto(postId, payload, token);
    },
    onSuccess: (res, { postId }) => {
      if (!res.success) return;
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}