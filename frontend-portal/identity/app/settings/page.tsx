import { SignInForm } from "@/components/SignInForm";

type SearchParams = { enrollment?: string };

export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  const params = await searchParams;
  return <SignInForm kind="settings" enrollmentRequired={params?.enrollment === "required"}/>;
}
