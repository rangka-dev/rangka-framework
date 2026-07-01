import { forwardRef, type ComponentProps } from 'react';
import { SendHorizonal, Paperclip } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from './icon';

export type ActivityFeedProps = ComponentProps<'div'> & {
  /** Show vertical timeline connector between items */
  showConnector?: boolean;
  /** Max height before scrolling (e.g. '400px', '100%'). Defaults to no limit. */
  maxHeight?: string;
};

export type ActivityFeedItemProps = ComponentProps<'div'> & {
  /** Entry type for semantic styling */
  type?: 'change' | 'event' | 'comment' | 'system';
};

export type ActivityFeedAvatarProps = ComponentProps<'div'>;

export type ActivityFeedContentProps = ComponentProps<'div'>;

export type ActivityFeedHeaderProps = ComponentProps<'div'> & {
  /** Relative timestamp string */
  timestamp?: string;
};

export type ActivityFeedBodyProps = ComponentProps<'div'>;

export type ActivityFeedDiffProps = ComponentProps<'span'> & {
  /** Previous value */
  from?: string;
  /** New value */
  to?: string;
};

export type ActivityFeedEmptyProps = ComponentProps<'div'>;

export type ActivityFeedCommentInputProps = ComponentProps<'div'> & {
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Callback when comment is submitted */
  onSubmit?: (value: string) => void;
  /** Callback when attach file is clicked */
  onAttach?: () => void;
};

const ActivityFeedRoot = forwardRef<HTMLDivElement, ActivityFeedProps>(
  ({ className, showConnector, maxHeight, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative flex flex-col gap-4 overflow-y-auto', className)}
        style={{ maxHeight, ...style }}
        {...props}
      >
        {showConnector && (
          <div className="absolute left-[15px] top-6 bottom-14 w-px bg-border" aria-hidden />
        )}
        {children}
      </div>
    );
  },
);
ActivityFeedRoot.displayName = 'ActivityFeed';

const ActivityFeedItem = forwardRef<HTMLDivElement, ActivityFeedItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative z-10 flex items-start gap-3', className)} {...props}>
        {children}
      </div>
    );
  },
);
ActivityFeedItem.displayName = 'ActivityFeed.Item';

const ActivityFeedAvatar = forwardRef<HTMLDivElement, ActivityFeedAvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('shrink-0 rounded-full bg-background', className)} {...props}>
        {children}
      </div>
    );
  },
);
ActivityFeedAvatar.displayName = 'ActivityFeed.Avatar';

const ActivityFeedContent = forwardRef<HTMLDivElement, ActivityFeedContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex min-w-0 flex-1 flex-col gap-1 pt-1.5', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ActivityFeedContent.displayName = 'ActivityFeed.Content';

const ActivityFeedHeader = forwardRef<HTMLDivElement, ActivityFeedHeaderProps>(
  ({ className, timestamp, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-1.5 text-2xs', className)}
        {...props}
      >
        {children}
        {timestamp && (
          <span className="ml-auto text-2xs text-muted-foreground/50">{timestamp}</span>
        )}
      </div>
    );
  },
);
ActivityFeedHeader.displayName = 'ActivityFeed.Header';

const ActivityFeedBody = forwardRef<HTMLDivElement, ActivityFeedBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mt-0.5', className)} {...props}>
        {children}
      </div>
    );
  },
);
ActivityFeedBody.displayName = 'ActivityFeed.Body';

const ActivityFeedDiff = forwardRef<HTMLSpanElement, ActivityFeedDiffProps>(
  ({ className, from, to, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5 text-2xs', className)}
        {...props}
      >
        {from && (
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
            {from}
          </span>
        )}
        <span className="text-muted-foreground/50">→</span>
        {to && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{to}</span>}
      </span>
    );
  },
);
ActivityFeedDiff.displayName = 'ActivityFeed.Diff';

const ActivityFeedEmpty = forwardRef<HTMLDivElement, ActivityFeedEmptyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-8 text-center text-2xs text-muted-foreground/50', className)}
        {...props}
      >
        {children ?? 'No activity yet.'}
      </div>
    );
  },
);
ActivityFeedEmpty.displayName = 'ActivityFeed.Empty';

const ActivityFeedCommentInput = forwardRef<HTMLDivElement, ActivityFeedCommentInputProps>(
  ({ className, placeholder = 'Write a comment...', onSubmit, onAttach, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative z-10 flex flex-col gap-2 bg-background pt-3', className)}
        {...props}
      >
        <div className="relative">
          <textarea
            className="min-h-[72px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 pb-9 text-2xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
            placeholder={placeholder}
            rows={3}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
              onClick={onAttach}
            >
              <Icon icon={Paperclip} size="sm" />
            </button>
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded bg-foreground text-background transition-colors hover:bg-foreground/80"
              onClick={() => onSubmit?.('')}
            >
              <Icon icon={SendHorizonal} size="sm" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);
ActivityFeedCommentInput.displayName = 'ActivityFeed.CommentInput';

export const ActivityFeed = Object.assign(ActivityFeedRoot, {
  Item: ActivityFeedItem,
  Avatar: ActivityFeedAvatar,
  Content: ActivityFeedContent,
  Header: ActivityFeedHeader,
  Body: ActivityFeedBody,
  Diff: ActivityFeedDiff,
  Empty: ActivityFeedEmpty,
  CommentInput: ActivityFeedCommentInput,
});
