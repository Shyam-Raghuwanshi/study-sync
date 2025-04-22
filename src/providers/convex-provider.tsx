
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const ConvexClientProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk
        useAuth={useAuth}
        client={convex}
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};