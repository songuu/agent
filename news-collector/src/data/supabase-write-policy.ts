export function rejectSupabaseDataWrite(operation: string): never {
  throw new Error(
    `${operation} refused: Supabase/PostgREST data uploads are disabled for this project; use the server PostgreSQL content repository instead.`,
  );
}
