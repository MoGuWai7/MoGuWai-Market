// 공통 Input — label, error, helperText 통합
// - 포커스 시 브랜드 오렌지 ring
// - 에러 시 빨간 테두리 + 메시지
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-[14px] text-neutral-900 placeholder-neutral-400 transition",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:bg-neutral-50 disabled:cursor-not-allowed",
            error
              ? "border-red-300 focus:ring-red-400"
              : "border-neutral-200 focus:ring-[var(--brand-500)]",
            className,
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-red-500 ml-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[12px] text-neutral-400 ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
