import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion | KTA"
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-2xl border border-zinc-200/70 bg-white/80 p-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mb-6">
            <h1 className="text-pretty text-2xl font-semibold tracking-tight">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Connectez-vous avec votre email et votre mot de passe.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

