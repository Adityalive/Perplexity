import React from 'react';
import { SignUp } from "@clerk/clerk-react";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111] overflow-hidden">
        <SignUp routing="path" path="/register" signInUrl="/login" forceRedirectUrl="/" />
    </div>
  );
}
