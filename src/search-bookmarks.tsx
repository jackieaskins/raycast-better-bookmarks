import { List } from "@raycast/api";
import BookmarkRow from "./components/BookmarkRow";
import getBookmarks from "./utils/getBookmarks";
import { useCachedPromise } from "@raycast/utils";

export default function Command() {
  const { data: bookmarksByProfile, isLoading } =
    useCachedPromise(getBookmarks);

  return (
    <List isLoading={isLoading}>
      {Object.entries(bookmarksByProfile ?? {}).map(
        ([profileName, bookmarks]) => (
          <List.Section key={profileName} title={profileName}>
            {bookmarks?.map((bookmark) => (
              <BookmarkRow key={bookmark.id} bookmark={bookmark} />
            ))}
          </List.Section>
        ),
      )}
    </List>
  );
}
