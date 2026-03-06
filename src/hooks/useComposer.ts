import { createContext, useContext } from 'react';

interface ComposerContextValue {
  openComposer: (prefillText?: string) => void;
}

export const ComposerContext = createContext<ComposerContextValue>({
  openComposer: () => {},
});

export function useComposer() {
  return useContext(ComposerContext);
}
