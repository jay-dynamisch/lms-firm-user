import { twMerge } from 'tailwind-merge';

// We don't have clsx in package.json, so we'll implement a simple version of it
// or just rely on tailwind-merge directly if we pass arrays.v v    v  
// Actually, let's just use a simple filter for truthy values and pass to twMerge.
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}