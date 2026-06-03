"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{
        padding: "6px 12px",
        fontSize: 14,
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
