/* eslint-disable @typescript-eslint/no-explicit-any */
declare type SettingsExpression<T> = {
  /**
   * The name of the environmental variable.
   */
  variable: string;
  /**
   * The default value to use if the variable is undefined.
   */
  defaultValue: T;
};

declare type SettingsRegistry<Settings> = {
  [Property in keyof Settings]: SettingsExpression<Settings[Property]>;
};

export function resolveEnvironmentSettings<Settings extends { [key: string]: any }>(
  registry: SettingsRegistry<Settings>,
): Settings {
  const settings: Settings = {} as Settings;
  Object.entries(registry).forEach(([key, val]) => {
    const property = key as keyof Settings;
    const { variable, defaultValue } = val as SettingsExpression<any>;
    const variableValue = process.env[variable] ?? defaultValue;
    if (variableValue) {
      settings[property] = variableValue;
    }
  });

  return settings;
}

export interface DeploymentSettings {
  deploymentGroup?: string;
}

const deployment = resolveEnvironmentSettings<DeploymentSettings>({
  deploymentGroup: {
    variable: 'DOVETAIL_DEPLOYMENT_GROUP',
    defaultValue: undefined, // or hardcode something
  },
});
