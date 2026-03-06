import { FeatureGrid } from "@/components/home/feature-grid";
import { HeroSection } from "@/components/home/hero-section";
import { PreviewPanel } from "@/components/home/preview-panel";
import { SetupRequired } from "@/components/setup/setup-required";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabaseReady = hasSupabaseEnv();
  let isAuthenticated = false;

  if (supabaseReady) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {!supabaseReady ? <SetupRequired /> : null}
      <HeroSection isAuthenticated={isAuthenticated} />
      <FeatureGrid />
      <PreviewPanel />
    </div>
  );
}