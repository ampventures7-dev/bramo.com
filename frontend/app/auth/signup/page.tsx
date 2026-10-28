import { redirect } from "next/navigation";

export default function AuthSignupRedirect({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams ? new URLSearchParams(searchParams as Record<string, string>).toString() : "";
  redirect(query ? `/signup?${query}` : "/signup");
}
