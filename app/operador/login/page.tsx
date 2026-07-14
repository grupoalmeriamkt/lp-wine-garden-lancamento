"use client";
import { Suspense } from "react";
import { LoginForm } from "@/app/admin/login/LoginForm";

export default function OperadorLogin() {
  return (
    <Suspense fallback={null}>
      <LoginForm role="operator" title="Validação — Wine Garden" next="/operador" />
    </Suspense>
  );
}
