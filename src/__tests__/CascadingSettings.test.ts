import {
  createHierarchy,
  groupSettings,
  ISettingsSource,
  loadSettings,
  Setting,
  SettingsToken,
} from '../CascadingSettings';

function createStubbedSource<Params>(
  category: keyof Params,
  provenance: string,
  resolver: () => Promise<Setting<Params>[]>,
): ISettingsSource<Params> {
  return {
    category,
    provenance,
    loadSettings() {
      return resolver();
    },
  };
}

interface SampleCategories {
  a: undefined;
  b: undefined;
  c: undefined;
}

describe('Cascading Settings', () => {
  describe('createHierarchy', () => {
    test('creates the comparer relative to the order of args', () => {
      const srcA = createStubbedSource<SampleCategories>('a', 'srcA', async () => []);
      const srcB = createStubbedSource<SampleCategories>('b', 'srcB', async () => []);
      const srcC = createStubbedSource<SampleCategories>('c', 'srcC', async () => []);

      const hierarchy = createHierarchy<SampleCategories>(srcC, srcA, srcB);

      const tokenA: SettingsToken<SampleCategories> = { category: 'a', key: 'key1' };
      const tokenB: SettingsToken<SampleCategories> = { category: 'b', key: 'key1' };
      const tokenC: SettingsToken<SampleCategories> = { category: 'c', key: 'key1' };

      expect(hierarchy.sort(tokenC, tokenA)).toBe(-1);
      expect(hierarchy.sort(tokenC, tokenB)).toBe(-1);
      expect(hierarchy.sort(tokenA, tokenB)).toBe(-1);
      expect(hierarchy.sort(tokenB, tokenA)).toBe(1);
      expect(hierarchy.sort(tokenB, tokenC)).toBe(1);
      expect(hierarchy.sort(tokenB, tokenB)).toBe(0);
    });
  });

  // If we're going to flatten them, first we need to group by key
  describe('groupSettings', () => {
    it('groups the matching keys', async () => {
      const sharedKey = 'SHARED';
      const aSettings: Setting<SampleCategories>[] = [
        { category: 'a', key: sharedKey, value: 'A', provenance: 'test' },
        { category: 'a', key: 'another key', value: 'Another', provenance: 'test' },
      ];
      const bSettings: Setting<SampleCategories>[] = [
        { category: 'b', key: sharedKey, value: 'B', provenance: 'test' },
      ];
      const cSettings: Setting<SampleCategories>[] = [
        { category: 'a', key: sharedKey, value: 'C', provenance: 'test' },
      ];

      const hierarchy = createHierarchy<SampleCategories>(
        createStubbedSource<SampleCategories>('a', 'srcA', async () => aSettings),
        createStubbedSource<SampleCategories>('b', 'srcB', async () => bSettings),
        createStubbedSource<SampleCategories>('c', 'srcC', async () => cSettings),
      );

      const groups = await groupSettings(hierarchy);
      expect(groups.length).toBe(2);
      expect(groups[0].key).toBe(sharedKey);
      expect(groups[0].settings.length).toBe(3);

      expect(groups[1].key).toBe('another key');
    });
  });

  describe('loadSettings', () => {
    it('groups the matching keys', async () => {
      const sharedKey = 'SHARED';
      const aSettings: Setting<SampleCategories>[] = [
        { category: 'a', key: sharedKey, value: 'A', provenance: 'test' },
        { category: 'a', key: 'another key', value: 'Another', provenance: 'test' },
      ];
      const bSettings: Setting<SampleCategories>[] = [
        { category: 'b', key: sharedKey, value: 'B', provenance: 'test' },
      ];
      const cSettings: Setting<SampleCategories>[] = [
        { category: 'c', key: sharedKey, value: 'C', provenance: 'test' },
      ];

      const hierarchy = createHierarchy<SampleCategories>(
        createStubbedSource<SampleCategories>('a', 'srcA', async () => aSettings),
        createStubbedSource<SampleCategories>('b', 'srcB', async () => bSettings),
        createStubbedSource<SampleCategories>('c', 'srcC', async () => cSettings),
      );

      const settings = await loadSettings(hierarchy);
      expect(settings.length).toBe(2);

      expect(settings[0].key).toBe(sharedKey);
      expect(settings[0].value).toBe('C');
      expect(settings[0].category).toBe('c');

      expect(settings[0].parent?.key).toBe(sharedKey);
      expect(settings[0].parent?.value).toBe('B');
      expect(settings[0].parent?.category).toBe('b');

      expect(settings[0].parent?.parent?.key).toBe(sharedKey);
      expect(settings[0].parent?.parent?.value).toBe('A');
      expect(settings[0].parent?.parent?.category).toBe('a');
    });
  });
});
