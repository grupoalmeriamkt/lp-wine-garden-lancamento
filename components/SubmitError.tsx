"use client";
import { createPortal } from "react-dom";

export default function SubmitError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="submit-loader" role="alertdialog" aria-labelledby="submit-error-title">
      <div className="submit-loader__inner">
        <p id="submit-error-title" className="submit-loader__title">
          Não foi possível concluir
        </p>
        <p className="submit-error__message">{message}</p>
        <button type="button" className="btn" onClick={onRetry}>
          Voltar e tentar novamente
        </button>
      </div>
    </div>,
    document.body
  );
}
