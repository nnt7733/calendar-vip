import { auth } from '@clerk/nextjs/server';

export const getUserIdOrDev = async () => {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch (error) {
    // Fall back to dev user when auth context is unavailable.
  }
  if (process.env.NODE_ENV !== 'production') return 'local-dev-user';
  return null;
};
