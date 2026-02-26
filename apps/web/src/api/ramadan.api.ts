"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiRpc,
  callRpc,
  getApiClient,
  type InferRequestType,
  type InferResponseType,
} from "@/api/client";

const $getChallenges = apiRpc.challenges.$get;
const $getChallenge = apiRpc.challenges[":dayNumber"].$get;
const $getLeaderboard = apiRpc.leaderboard.$get;
const $getLeaderboardBreakdown = apiRpc.leaderboard.breakdown.$get;
const $generate = apiRpc.generate.$post;
const $createSubmission = apiRpc.submissions.$post;
const $getMySubmissions = apiRpc.submissions.me.$get;

export type GetChallengesResponse = InferResponseType<typeof $getChallenges, 200>;
export type GetChallengeResponse = InferResponseType<typeof $getChallenge, 200>;
export type GetLeaderboardResponse = InferResponseType<typeof $getLeaderboard, 200>;
export type GetLeaderboardBreakdownResponse = InferResponseType<typeof $getLeaderboardBreakdown, 200>;
export type GenerateRequest = InferRequestType<typeof $generate>["json"];
export type GenerateResponse = InferResponseType<typeof $generate, 200>;
export type CreateSubmissionRequest = InferRequestType<typeof $createSubmission>["json"];
export type CreateSubmissionResponse = InferResponseType<typeof $createSubmission, 201>;
export type MySubmissionsResponse = InferResponseType<typeof $getMySubmissions, 200>;

export async function getChallenges() {
  const client = await getApiClient();
  return callRpc(client.challenges.$get());
}

export async function getChallengeByDay(dayNumber: number) {
  const client = await getApiClient();
  return callRpc(client.challenges[":dayNumber"].$get({ param: { dayNumber: String(dayNumber) } }));
}

export async function getLeaderboard(page = 1, limit = 100) {
  const client = await getApiClient();
  return callRpc(
    client.leaderboard.$get({ query: { page: String(page), limit: String(limit) } })
  );
}

export async function getMyLeaderboardRank() {
  const client = await getApiClient();
  return callRpc(client.leaderboard.me.$get());
}

export async function getLeaderboardBreakdown() {
  const client = await getApiClient();
  return callRpc(client.leaderboard.breakdown.$get());
}

export async function generateCode(params: GenerateRequest) {
  const client = await getApiClient();
  return callRpc(client.generate.$post({ json: params }));
}

export async function createSubmission(params: CreateSubmissionRequest) {
  const client = await getApiClient();
  return callRpc(client.submissions.$post({ json: params }));
}

export async function getMySubmissions() {
  const client = await getApiClient();
  return callRpc(client.submissions.me.$get());
}

export function useGetChallenges() {
  return useQuery({
    queryKey: ["ramadan", "challenges"],
    queryFn: getChallenges,
  });
}

export function useGetChallenge(dayNumber: number, enabled = true) {
  return useQuery({
    enabled,
    retry: false,
    queryKey: ["ramadan", "challenge", dayNumber],
    queryFn: () => getChallengeByDay(dayNumber),
  });
}

export function useGetLeaderboard(page: number, pageSize = 100) {
  return useQuery({
    queryKey: ["ramadan", "leaderboard", { page, pageSize }],
    queryFn: () => getLeaderboard(page, pageSize),
    placeholderData: (prev) => prev,
  });
}

export function useGetMyLeaderboardRank() {
  return useQuery({
    queryKey: ["ramadan", "leaderboard", "me"],
    queryFn: getMyLeaderboardRank,
  });
}

export function useGetLeaderboardBreakdown() {
  return useQuery({
    queryKey: ["ramadan", "leaderboard", "breakdown"],
    queryFn: getLeaderboardBreakdown,
  });
}

export function useGetMySubmissions(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["ramadan", "submissions", "me"],
    queryFn: getMySubmissions,
  });
}

export function useGenerateCode() {
  return useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationKey: ["ramadan", "generate"],
    mutationFn: generateCode,
    onError: (error) => {
      toast.error(error.message || "Generation failed");
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation<CreateSubmissionResponse, Error, CreateSubmissionRequest>({
    mutationKey: ["ramadan", "submission", "create"],
    mutationFn: createSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ramadan", "submissions", "me"] });
      queryClient.invalidateQueries({ queryKey: ["ramadan", "leaderboard"] });
    },
    onError: (error) => {
      toast.error(error.message || "Submission failed");
    },
  });
}
