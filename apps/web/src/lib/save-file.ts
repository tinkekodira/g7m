/**
 * Handing a file the app made to the person using it.
 *
 * The obvious way — a link with `download` on it — is the wrong one on the
 * platform that matters most. On an iPhone this app runs as a Home Screen web
 * app (ADR-0026), and there a download link opens the file in a full-screen
 * viewer that the app cannot navigate back from. The share sheet is how iOS
 * saves a file — Save to Files, Mail, AirDrop — and Android's sheet does the
 * same.
 *
 * So a touch device with a share sheet that takes files gets the sheet, and
 * anything else — a desktop browser, where the download bar is exactly right —
 * gets the link.
 *
 * Not covered, and said so: the Android app from Capacitor has no Web Share
 * in its WebView and does not act on download links, so a file needs a native
 * plugin there. It is a debug build nobody is using yet (ADR-0026).
 */

export type SaveMethod = 'share' | 'download';

export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled';

/**
 * Which way to hand over a file. Pure, so the rule is tested without a browser.
 *
 * A fine pointer means a mouse or trackpad, where the download link is the
 * better experience even when a share sheet exists — Windows has one, and
 * nobody exporting a file from a laptop wants it.
 */
export function chooseSaveMethod(capabilities: {
  readonly canShareFiles: boolean;
  readonly hasFinePointer: boolean;
}): SaveMethod {
  return capabilities.canShareFiles && !capabilities.hasFinePointer ? 'share' : 'download';
}

/**
 * `g7m-export-2026-09-13.json`: the app, what it is, and the day — the local
 * day, since that is the one the person will look for.
 */
export function exportFileName(at: Date): string {
  const year = String(at.getFullYear());
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `g7m-export-${year}-${month}-${day}.json`;
}

/** Save `file` the best way this device has. */
export async function saveFile(file: File, hasFinePointer: boolean): Promise<SaveOutcome> {
  const canShareFiles =
    typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  if (chooseSaveMethod({ canShareFiles, hasFinePointer }) === 'share') {
    try {
      await navigator.share({ files: [file], title: file.name });
      return 'shared';
    } catch (error: unknown) {
      // Closing the sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Anything else — the sheet refusing a type, a permission — falls
      // through to the link rather than leaving the person with nothing.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    // After the click has been handled, not before: revoking synchronously can
    // cancel the download in some engines before it has started.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
  return 'downloaded';
}
