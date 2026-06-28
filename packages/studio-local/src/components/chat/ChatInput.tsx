import { useRef, useState, useCallback } from 'react';
import { SendHorizonal, Paperclip, ChevronDown, X, FileText, Image, Square } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useStudio } from '@/hooks/useStudio';

type Attachment = {
  name: string;
  type: 'file' | 'image';
};

type ChatInputProps = {
  onSend: (text: string) => void;
};

export function ChatInput({ onSend }: ChatInputProps) {
  const { settings, availableModels, setModel, isAgentWorking, stop } = useStudio();
  const [value, setValue] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeProviderSettings = settings?.providers?.[settings.activeProvider] ?? {};
  const activeModelId = activeProviderSettings.model ?? '';
  const selectedModels = (activeProviderSettings.selectedModels ?? []).map((id) => {
    const found = availableModels.find((m) => m.id === id);
    return { id, name: found?.name || id };
  });
  const activeModelLabel =
    selectedModels.find((m) => m.id === activeModelId)?.name ?? (activeModelId || 'Select model');

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectModel = (modelId: string) => {
    setModel(modelId);
    setModelOpen(false);
  };

  const addAttachment = (type: 'file' | 'image') => {
    const name = type === 'file' ? 'document.ts' : 'screenshot.png';
    setAttachments((prev) => [...prev, { name, type }]);
    setAttachOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
            >
              {att.type === 'file' ? (
                <FileText className="size-3 text-muted-foreground" />
              ) : (
                <Image className="size-3 text-muted-foreground" />
              )}
              <span>{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/50">
        <div className="flex items-end px-3 py-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isAgentWorking ? (
            <button
              onClick={stop}
              className="ml-2 flex shrink-0 items-center justify-center rounded-md p-1 text-destructive transition-colors hover:text-destructive/80"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim()}
              className="ml-2 flex shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <SendHorizonal className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                <span>{activeModelLabel}</span>
                <ChevronDown className="size-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-1" align="start">
              {selectedModels.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Select models in Settings
                </div>
              ) : (
                selectedModels.map((m) => (
                  <button
                    key={m.id}
                    className={`flex w-full items-center rounded-md px-2 py-1.5 text-xs hover:bg-muted ${
                      m.id === activeModelId ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => handleSelectModel(m.id)}
                  >
                    {m.name}
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>

          <Popover open={attachOpen} onOpenChange={setAttachOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                <Paperclip className="size-3" />
                <span>Attach</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[160px] p-1" align="start">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                onClick={() => addAttachment('file')}
              >
                <FileText className="size-3.5" />
                File
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                onClick={() => addAttachment('image')}
              >
                <Image className="size-3.5" />
                Image
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
