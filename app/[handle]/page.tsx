import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import { getPublicBookmarksByHandle, getProfileByHandle } from "@/lib/db/queries";

export default async function HandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  // Check if profile exists
  const profile = await getProfileByHandle(handle);
  if (!profile) {
    notFound();
  }

  // Get public bookmarks for the profile
  const bookmarks = await getPublicBookmarksByHandle(handle);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
              {handle.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                @{handle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                LinkNest Profile
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {bookmarks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No public bookmarks yet
                </p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {bookmark.title}
                  </h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {bookmark.url}
                  </a>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(bookmark.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
