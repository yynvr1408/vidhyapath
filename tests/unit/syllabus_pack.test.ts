// Unit: every frontend/public/packs/*.json parses and declares language, class and board; no email/phone keys.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { PACK_DIR } from '../helpers/harness';
import { findKeysNamed } from '../helpers/keys';

const files = fs.readdirSync(PACK_DIR).filter((f) => f.endsWith('.json'));

describe('syllabus packs', () => {
  it('at least one pack exists', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(file, () => {
      const raw = fs.readFileSync(`${PACK_DIR}/${file}`, 'utf8');

      it('parses as JSON', () => {
        expect(() => JSON.parse(raw)).not.toThrow();
      });

      it('declares language, class and board', () => {
        const pack = JSON.parse(raw);
        expect(typeof pack.language).toBe('string');
        expect(pack.language.length).toBeGreaterThan(0);
        expect(pack.class).toBeDefined();
        expect(typeof pack.board).toBe('string');
        expect(pack.board.length).toBeGreaterThan(0);
      });

      it('has no email or phone keys', () => {
        expect(findKeysNamed(JSON.parse(raw), ['email', 'phone'])).toEqual([]);
      });
    });
  }
});
