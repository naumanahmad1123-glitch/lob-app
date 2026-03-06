import { createContext, useContext } from 'react';

export interface ComposerOptions {
  prefillText?: string;
  /** Pre-select individual user IDs as recipients */
  prefillUserIds?: string[];
}

interface ComposerContextValue {
  openComposer: (options?: ComposerOptions) => void;
}

export const ComposerContext = createContext<ComposerContextValue>({
  openComposer: () => {},
});

export function useComposer() {
  return useContext(ComposerContext);
}
