/**
 * In-memory store for the current scan image URI.
 *
 * expo-router URL-encodes route params, which mangles local `file://` URIs
 * when they are passed between screens (double-encoding on each hop).
 * Storing the URI here bypasses that entirely.
 */
let _uri: string | null = null;

export const setScanImageUri = (uri: string): void => { _uri = uri; };
export const getScanImageUri = (): string | null => _uri;
export const clearScanImageUri = (): void => { _uri = null; };
