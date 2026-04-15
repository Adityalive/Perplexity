import React from 'react';
import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111] overflow-hidden">
        <SignIn routing="path" path="/login" signUpUrl="/register" forceRedirectUrl="/" />
    </div>
  );
}
