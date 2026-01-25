import type { ReactNode } from 'react';

/**
 * FloatingPlayersContext has been fully deprecated.
 *
 * The app now relies exclusively on `PlayerContext` + `EmbeddedPlayerDrawer`.
 * This placeholder exists solely to prevent accidental imports from older
 * branches. Do not use it.
 */
export const FloatingPlayersProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const useFloatingPlayers = () => {
  throw new Error('FloatingPlayersContext has been removed. Use usePlayer() instead.');
};
