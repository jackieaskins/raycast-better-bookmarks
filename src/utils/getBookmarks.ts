import { homedir } from "os";
import { Bookmark, BookmarkData, BookmarkFile, Browser } from "../types";
import { getPreferenceValues } from "@raycast/api";
import { readdirSync, statSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

const BROWSER_PATHS: Record<Browser, string> = {
  chrome: "Google/Chrome",
  brave: "BraveSoftware/Brave-Browser",
};

function getBookmarkData(
  currPath: string[],
  bookmark: Bookmark,
): BookmarkData[] {
  const newPath = [...currPath, bookmark.name];

  if (bookmark.type === "url") {
    return [
      {
        id: bookmark.guid,
        name: bookmark.name,
        folderPath: currPath,
        url: bookmark.url,
        fullPath: newPath,
      },
    ];
  }

  return bookmark.children.flatMap((child) => getBookmarkData(newPath, child));
}

/**
 * Gets all the bookmark directories.
 * The default location is found within <browser-path>/Default/Bookmarks/
 * Additional Chrome profiles are stored in: <browser-path>/Profile <number>/Bookmarks/
 */
function findBookmarkDirectories(basePath: string): string[] {
  const entries = readdirSync(basePath);

  return entries
    .map((entry) => ({ entry, fullPath: path.join(basePath, entry) }))
    .filter(
      ({ entry, fullPath }) =>
        statSync(fullPath).isDirectory() &&
        (entry === "Default" || entry.startsWith("Profile ")),
    )
    .map(({ fullPath }) => path.join(fullPath, "Bookmarks"));
}

async function loadBookmarkFiles(browser: Browser): Promise<BookmarkFile[]> {
  const basePath = path.join(
    homedir(),
    "Library",
    "Application Support",
    BROWSER_PATHS[browser],
  );

  return await Promise.all(
    findBookmarkDirectories(basePath).map(
      async (filePath) =>
        JSON.parse(
          (await readFile(filePath, "utf8")).toString(),
        ) as BookmarkFile,
    ),
  );
}

export default async function getBookmarks(): Promise<BookmarkData[]> {
  const { defaultBrowser } = getPreferenceValues<Preferences>();
  const bookmarkFiles = await loadBookmarkFiles(defaultBrowser);

  return bookmarkFiles.flatMap(({ roots }) =>
    Object.values(roots).flatMap(({ children }) =>
      children.flatMap((bookmark) => getBookmarkData([], bookmark)),
    ),
  );
}
