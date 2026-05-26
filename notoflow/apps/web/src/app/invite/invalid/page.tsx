import { Suspense } from "react";
import InvalidInviteClient from "./InvalidInviteClient";

export default function InvalidInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <InvalidInviteClient />
    </Suspense>
  );
}
