import { homedir } from "os";
import { Bookmark, BookmarkData, BookmarkFile, Browser } from "../types";
import { getPreferenceValues } from "@raycast/api";
import { readdirSync, lstatSync } from "fs";
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
function findBookmarkDirectories(basePath: string) {
  const entries = readdirSync(basePath);

  return entries
    .map((profileName) => ({
      profileName,
      profilePath: path.join(basePath, profileName),
    }))
    .filter(
      ({ profileName, profilePath }) =>
        lstatSync(profilePath).isDirectory() &&
        (profileName === "Default" || profileName.startsWith("Profile ")),
    )
    .map(({ profileName, profilePath }) => ({
      profileName,
      bookmarkFilePath: path.join(profilePath, "Bookmarks"),
    }));
}

async function loadBookmarkFiles(browser: Browser) {
  const basePath = path.join(
    homedir(),
    "Library",
    "Application Support",
    BROWSER_PATHS[browser],
  );

  return await Promise.all(
    findBookmarkDirectories(basePath).map(
      async ({ bookmarkFilePath, profileName }) => {
        const fileContents = await readFile(bookmarkFilePath, "utf8");

        return {
          profileName,
          bookmarkFile: JSON.parse(fileContents.toString()) as BookmarkFile,
        };
      },
    ),
  );
}

export default async function getBookmarks(): Promise<
  Record<string, BookmarkData[]>
> {
  const { defaultBrowser } = getPreferenceValues<Preferences>();
  const bookmarkFiles = await loadBookmarkFiles(defaultBrowser);

  return Object.fromEntries(
    bookmarkFiles.map(({ profileName, bookmarkFile: { roots } }) => [
      profileName,
      Object.values(roots).flatMap(({ children }) =>
        children.flatMap((bookmark) => getBookmarkData([], bookmark)),
      ),
    ]),
  );
}
