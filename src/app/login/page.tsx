import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (e: unknown) {
    // NEXT_REDIRECT is gegooid wanneer login slaagt en moet bubbelen.
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/login?error=1&next=" + encodeURIComponent(next));
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const error = searchParams.error;
  const next = searchParams.next ?? "/";
  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold mb-1">Aanmelden</h1>
      <p className="text-sm text-muted mb-6">
        Modelspoor Collectie. Eén gebruiker, maar wel met login om de data te
        beschermen.
      </p>
      <form action={loginAction} className="card p-4 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label">E-mail</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Wachtwoord</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>
        {error && (
          <p className="text-sm text-sbb">
            Aanmelden mislukt. Controleer e-mail en wachtwoord.
          </p>
        )}
        <button type="submit" className="btn-primary w-full justify-center">
          Inloggen
        </button>
      </form>
      <p className="text-xs text-muted mt-4">
        Gebruiker aanmaken via <code>npm run db:seed</code> (zie .env.example).
      </p>
    </div>
  );
}
