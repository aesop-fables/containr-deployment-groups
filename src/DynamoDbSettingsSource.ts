import { IDynamoService } from '@aesop-fables/containr-dynamofx';
import { ISettingsSource, Setting } from './CascadingSettings';
import { DeploymentGroupCategories, FindSettings } from './FindSettings';
import { lastFilledKey, resolveProvenance } from './resolveProvenance';

export class DynamoDbSettingsSource implements ISettingsSource<DeploymentGroupCategories> {
  constructor(private readonly options: DeploymentGroupCategories, private readonly dynamo: IDynamoService) {}

  get provenance(): string {
    return resolveProvenance(this.options);
  }

  get category(): keyof DeploymentGroupCategories {
    return lastFilledKey(this.options);
  }

  loadSettings(): Promise<Setting<DeploymentGroupCategories>[]> {
    // TODO -- Write a failing unit test to show that this can't handle larger collection sets
    return this.dynamo.execute(FindSettings, this.options);
  }
}
