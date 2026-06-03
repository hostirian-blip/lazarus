"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-ghost btn-block" style={{ padding: "8px", fontSize: 13 }}>
      Sign out
    </button>
  );
}
