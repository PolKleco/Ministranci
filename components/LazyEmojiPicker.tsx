'use client';

import { useEffect, useState, type ComponentType } from 'react';

type EmojiSelectPayload = { native: string };

interface LazyEmojiPickerProps {
  open: boolean;
  locale?: string;
  theme: 'light' | 'dark';
  className?: string;
  onSelect: (emoji: EmojiSelectPayload) => void;
}

export default function LazyEmojiPicker({
  open,
  locale = 'pl',
  theme,
  className,
  onSelect,
}: LazyEmojiPickerProps) {
  const [PickerComponent, setPickerComponent] = useState<null | ComponentType<any>>(null);
  const [emojiData, setEmojiData] = useState<any>(null);

  useEffect(() => {
    if (!open || (PickerComponent && emojiData)) return;
    let cancelled = false;

    void (async () => {
      const [{ default: Picker }, { default: data }] = await Promise.all([
        import('@emoji-mart/react'),
        import('@emoji-mart/data'),
      ]);
      if (cancelled) return;
      setPickerComponent(() => Picker);
      setEmojiData(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, PickerComponent, emojiData]);

  if (!open) return null;

  if (!PickerComponent || !emojiData) {
    return (
      <div className={className}>
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          Ładowanie emoji...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <PickerComponent
        data={emojiData}
        locale={locale}
        theme={theme}
        onEmojiSelect={onSelect}
      />
    </div>
  );
}
