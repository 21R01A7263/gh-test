// src/app/page.tsx
"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <SignedOut>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to GitHub Repo Viewer
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to continue.
          </p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50 transition-colors">
              Sign in with GitHub
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <RedirectToDashboard />
        </SignedIn>
      </div>
    </main>
  );
}

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        You are signed in.
      </h1>
      <p className="text-lg text-gray-600">Redirecting to your dashboard...</p>
    </div>
  );
}