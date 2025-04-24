
import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import { Loader } from '@/components/ui/loader';
function UserProfile() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return (
    <>
      {isLoading && <Loader />}
      {!isAuthenticated && !isLoading && <>
        <Button variant="ghost" asChild>
          <SignInButton />
        </Button>
        <Button asChild>
          <SignUpButton />
        </Button>
      </>}

      {isAuthenticated && <UserButton />}
    </>
  )
}

export default UserProfile