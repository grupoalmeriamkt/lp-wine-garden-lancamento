"use client";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <LoginForm role="admin" title="Painel — Wine Garden" next="/admin" />
    </Suspense>
  );
}
