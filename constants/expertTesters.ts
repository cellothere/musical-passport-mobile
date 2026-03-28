// Spotify user IDs for expert testers who can flag tracks for review.
// Add or remove IDs here to grant/revoke access.
export const EXPERT_TESTER_IDS = new Set<string>([
  '1257008379',
  'vlaswag22'
]);

export function isExpertTester(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return EXPERT_TESTER_IDS.has(userId);
}
