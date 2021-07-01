import { useCallback, useMemo, useState } from 'react';
import { writeText } from './util';

export function useCopy(copied: string, display?: string, replaceText?: string) {
  const [didCopy, setDidCopy] = useState(false);
  const doCopy = useCallback(() => {
    writeText(copied);
    setDidCopy(true);
    setTimeout(() => {
      setDidCopy(false);
    }, 2000);
  }, [copied]);

  const copyDisplay = useMemo(() => (didCopy ? (replaceText ?? 'Copied') : display), [
    didCopy,
    display
  ]);

  return { copyDisplay, doCopy, didCopy };
}
