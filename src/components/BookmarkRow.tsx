import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useMemo } from "react";
import { BookmarkData } from "../types";
import { getFavicon } from "@raycast/utils";

type BookmarkRowProps = {
  bookmark: BookmarkData;
};

const MAX_LENGTH = 50;

export default function BookmarkRow({
  bookmark: { name, folderPath, url, fullPath },
}: BookmarkRowProps) {
  const subtitle = useMemo(
    () => (url.length > MAX_LENGTH ? `${url.slice(0, MAX_LENGTH)}...` : url),
    [url],
  );
  const accessories = useMemo(
    () =>
      folderPath.length
        ? [{ icon: Icon.Folder, text: folderPath.join("/") }]
        : [],
    [folderPath],
  );
  const favicon = useMemo(
    () => getFavicon(new URL(url).origin, { fallback: Icon.Bookmark }),
    [url],
  );
  const keywords = useMemo(
    () => [...fullPath.flatMap((part) => part.split(" ")), url],
    [fullPath, url],
  );

  return (
    <List.Item
      icon={favicon}
      title={name}
      subtitle={subtitle}
      keywords={keywords}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={url} />
          <Action.CopyToClipboard content={url} />
        </ActionPanel>
      }
    />
  );
}
