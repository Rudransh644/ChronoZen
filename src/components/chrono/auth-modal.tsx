'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useUser } from '@/firebase';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateAnonymousSignIn,
} from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AuthModal({ isOpen, setIsOpen }: AuthModalProps) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = (action: 'signup' | 'signin' | 'anonymous') => {
    setError(null);
    startTransition(() => {
      try {
        if (action === 'signup') {
          initiateEmailSignUp(auth, email, password);
        } else if (action === 'signin') {
          initiateEmailSignIn(auth, email, password);
        } else if (action === 'anonymous') {
          initiateAnonymousSignIn(auth);
        }
        // No await, onAuthStateChanged will handle the rest.
        // We can close the modal optimistically.
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Account' : 'Login or Sign Up'}</DialogTitle>
          <DialogDescription>
            {user
              ? `You are logged in as ${user.isAnonymous ? 'Anonymous' : user.email}.`
              : 'Sign in to sync your preferences across devices.'}
          </DialogDescription>
        </DialogHeader>
        {isUserLoading ? (
          <div className="flex items-center justify-center h-24">
             <Loader2 className="animate-spin" />
          </div>
        ) : user ? (
          <div className="py-4">
            <Button onClick={handleSignOut} variant="destructive" className="w-full">
              Log Out
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <div className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                    <p className="text-sm font-medium text-destructive mt-2">{error}</p>
                )}
            </div>
            <TabsContent value="signin">
              <Button
                onClick={() => handleAuthAction('signin')}
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </TabsContent>
            <TabsContent value="signup">
              <Button
                onClick={() => handleAuthAction('signup')}
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </TabsContent>
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue as
                    </span>
                </div>
            </div>
            <Button
                variant="secondary"
                onClick={() => handleAuthAction('anonymous')}
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anonymous User
              </Button>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
