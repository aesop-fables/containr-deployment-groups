import { inject } from '@aesop-fables/containr';
import { DynamoServices, IDynamoService } from '@aesop-fables/containr-dynamofx';
import { createHierarchy, ICascadingHierarchy, loadSettings, Setting } from './CascadingSettings';
import { DynamoDbSettingsSource } from './DynamoDbSettingsSource';
import { DeploymentGroupCategories } from './FindSettings';
import { resolveEnvironmentSettings } from './resolveEnvironmentSettings';

export interface IServerConfigProvider {
  allSettings(): Promise<Setting<DeploymentGroupCategories>[]>;
}

export interface ServerConfigSettings {
  environment: string;
  region: string;
  configType: string;
}

export class ServerConfigProvider implements IServerConfigProvider {
  private readonly hierarchy: ICascadingHierarchy<DeploymentGroupCategories>;
  constructor(@inject(DynamoServices.Service) private readonly dynamo: IDynamoService) {
    const settings = resolveEnvironmentSettings<ServerConfigSettings>({
      environment: {
        variable: 'BLUE_ENVIRONMENT',
        defaultValue: '',
      },
      region: {
        variable: 'BLUE_REGION',
        defaultValue: '',
      },
      configType: {
        variable: 'BLUE_CONFIG_TYPE',
        defaultValue: '',
      },
    });

    this.hierarchy = createHierarchy<DeploymentGroupCategories>(
      new DynamoDbSettingsSource({ environment: settings.environment }, dynamo),
      new DynamoDbSettingsSource({ environment: settings.environment, region: settings.region }, dynamo),
      new DynamoDbSettingsSource(
        { environment: settings.environment, region: settings.region, configType: settings.configType },
        dynamo,
      ),
    );
  }

  allSettings(): Promise<Setting<DeploymentGroupCategories>[]> {
    return loadSettings(this.hierarchy);
  }
}
