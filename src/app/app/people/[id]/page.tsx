import Link from 'next/link'
import { isEntityId } from '@/lib/db/serialize'
import { requireUserId } from '@/lib/auth-server'
import { getPersonWithTags } from '@/lib/db/repositories/people-repo'
import type { PersonWithTags } from '@/lib/hooks/use-people'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PersonDetailView } from './person-detail-view'

/**
 * Person detail page. SERVER COMPONENT — owner-scoped.
 *
 * Auth + data fetch happen on the server: requireUserId() establishes the
 * tenant, and getPersonWithTags(userId, id) only returns the person if it is
 * owned by that user and not soft-deleted (the ownership filter lives in the
 * repository). A person owned by someone else is indistinguishable from a
 * missing one — both render the same "not found" UI, no ownership leak.
 *
 * The interactive symbolic-system tabs live in the PersonDetailView client
 * component, which receives the already-fetched person as a prop.
 */
export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Invalid id -> treat as not found (avoids throwing BadIdError to the page).
  if (!isEntityId(id)) {
    return <PersonNotFound />
  }

  const userId = await requireUserId()
  const person = (await getPersonWithTags(userId, id)) as PersonWithTags | null

  if (!person) {
    return <PersonNotFound />
  }

  return <PersonDetailView person={person} />
}

function PersonNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="text-center">
        <p className="font-medium text-foreground">Person not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          The person you&apos;re looking for doesn&apos;t exist or was deleted.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/app/people">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to People
        </Link>
      </Button>
    </div>
  )
}
