import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mb-6">
            <h1 className="text-pretty text-2xl font-semibold tracking-tight">
              Définir un mot de passe
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>
          <UpdatePasswordForm />
        </div>
      </div>
    </main>
  );
}

