import { DeploymentGroupCategories } from './FindSettings';

export function resolveProvenance(options: DeploymentGroupCategories): string {
  const type = lastFilledKey(options);
  switch (type) {
    case 'configType':
      return `${options.environment}#${options.region}#${options.configType}`;
    case 'region':
      return `${options.environment}#${options.region}`;
  }

  return options.environment;
}

export function lastFilledKey(options: DeploymentGroupCategories): keyof DeploymentGroupCategories {
  if (options.configType) {
    return 'configType';
  }

  if (options.region) {
    return 'region';
  }

  return 'environment';
}
