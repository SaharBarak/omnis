import { Notice } from './notice'
import { Button } from '@/components/m3'


/**
 * A failed fetch, stated plainly, with the way out attached.
 *
 * The retry is a real text button rather than a bare tappable word: an error is
 * exactly the moment a user should not have to guess what is clickable.
 */
export function ErrorState({
  message = 'Something went wrong loading this.',
  retryLabel = 'Try again',
  onRetry,
}: {
  message?: string
  retryLabel?: string
  onRetry?: () => void
}) {
  return (
    <Notice
      variant="error"
      action={
        onRetry !== undefined ? (
          <Button variant="text" onPress={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Notice>
  )
}
