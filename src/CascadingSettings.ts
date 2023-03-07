// import { groupBy } from 'lodash';

function groupBy<T>(items: T[], key: keyof T): { [key: string]: T[] } {
  const groups: { [key: string]: T[] | undefined } = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const keyVal = item[key] as string;
    const values = groups[keyVal as string] ?? [];

    groups[keyVal] = [...values, item];
  }

  return groups as { [key: string]: T[] };
}

export interface SettingsToken<Params> {
  category: keyof Params;
  key: string;
}

export declare type SettingValue = string | number | boolean;

export interface Setting<Params> {
  key: string;
  category: keyof Params;
  value: string;
  provenance: string;
  parent?: Setting<Params>;
}

export interface ISettingsSource<Params> {
  provenance: string;
  category: keyof Params;
  loadSettings(): Promise<Setting<Params>[]>;
}

export interface ICascadingHierarchy<Params> {
  sort(x: SettingsToken<Params>, y: SettingsToken<Params>): number;
  get sources(): ISettingsSource<Params>[];
}

export function createHierarchy<Params>(...sources: ISettingsSource<Params>[]): ICascadingHierarchy<Params> {
  const categories = sources.map((x) => x.category) as (keyof Params)[];
  return {
    sort(x: SettingsToken<Params>, y: SettingsToken<Params>) {
      const left = categories.indexOf(x.category);
      const right = categories.indexOf(y.category);

      if (left < right) {
        return -1;
      }

      if (left === right) {
        return 0;
      }

      return 1;
    },
    sources,
  };
}

export interface SettingsGroup<Params> {
  key: string;
  settings: Setting<Params>[];
}

export async function groupSettings<Params>(hierarchy: ICascadingHierarchy<Params>): Promise<SettingsGroup<Params>[]> {
  const sources = hierarchy.sources;
  const matrix = await Promise.all(sources.map((x) => x.loadSettings()));
  let combinedSettings: Setting<Params>[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const set = matrix[i];
    combinedSettings = [...combinedSettings, ...set];
  }

  const groups = groupBy(combinedSettings, 'key');
  return Object.entries(groups).map(([key, val]) => {
    return {
      key,
      settings: val as Setting<Params>[],
    } as SettingsGroup<Params>;
  });
}

export async function loadSettings<Params>(hierarchy: ICascadingHierarchy<Params>): Promise<Setting<Params>[]> {
  const allSettings: Setting<Params>[] = [];
  const groups = await groupSettings(hierarchy);

  groups.forEach(({ settings }) => {
    const orderedSettings = [...settings];
    orderedSettings.sort((a, b) => {
      const left: SettingsToken<Params> = { category: a.category, key: a.key };
      const right: SettingsToken<Params> = { category: b.category, key: b.key };

      return hierarchy.sort(left, right);
    });

    if (settings.length === 0) {
      return;
    }

    let parent: Setting<Params> | undefined;
    orderedSettings.forEach((setting) => {
      setting.parent = parent;
      parent = setting;
    });

    allSettings.push(parent as Setting<Params>);
  });

  return allSettings;
}

// const setting: Setting<DeploymentGroupCategories> = {
//   category: 'deploymentGroup',
//   key: 'blah',
//   value: 'iooooalsdkflajdf',
// };

// const deploymentGroupSource = createSource(Categories.DeploymentGroup);
// const hierarchy = createHierarchy(deploymentGroupSource, Categories.Region, Categories.App);
