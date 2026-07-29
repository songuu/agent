const command = process.argv[2] || "supabase data upload";
console.error(
  `${command} refused: Supabase/PostgREST data uploads are disabled for this project; use server PostgreSQL content commands instead.`,
);
process.exitCode = 1;
