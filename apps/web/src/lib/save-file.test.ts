import { describe, expect, it } from 'vitest';
import { chooseSaveMethod, exportFileName } from './save-file.js';

describe('chooseSaveMethod', () => {
  it('uses the share sheet on a touch device that has one', () => {
    expect(chooseSaveMethod({ canShareFiles: true, hasFinePointer: false })).toBe('share');
  });

  it('downloads on a desktop, even one with a share sheet', () => {
    expect(chooseSaveMethod({ canShareFiles: true, hasFinePointer: true })).toBe('download');
  });

  it('downloads wherever files cannot be shared', () => {
    expect(chooseSaveMethod({ canShareFiles: false, hasFinePointer: false })).toBe('download');
    expect(chooseSaveMethod({ canShareFiles: false, hasFinePointer: true })).toBe('download');
  });
});

describe('exportFileName', () => {
  it('names the file after the local day it was made', () => {
    expect(exportFileName(new Date(2026, 8, 13, 23, 30))).toBe('g7m-export-2026-09-13.json');
    expect(exportFileName(new Date(2026, 0, 2, 0, 5))).toBe('g7m-export-2026-01-02.json');
  });
});
