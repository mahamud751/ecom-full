/**
 * Navigation from outside React components (push notifications, call
 * actions). Calls made before the NavigationContainer is ready — e.g. when a
 * call notification cold-starts the app — are queued and run on ready.
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootParamList>();

let pending: (() => void) | null = null;

export function navigateWhenReady<K extends keyof RootParamList>(
  ...args: undefined extends RootParamList[K]
    ? [screen: K, params?: RootParamList[K]]
    : [screen: K, params: RootParamList[K]]
) {
  const go = () => (navigationRef.navigate as (...a: unknown[]) => void)(...args);
  if (navigationRef.isReady()) go();
  else pending = go;
}

/** NavigationContainer onReady: run the queued navigation, if any. */
export function flushPendingNavigation() {
  const go = pending;
  pending = null;
  go?.();
}
