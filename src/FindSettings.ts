import { inject } from '@aesop-fables/containr';
import { IDynamoOperation, DynamoServices } from '@aesop-fables/containr-dynamofx';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Setting } from './CascadingSettings';
import { resolveProvenance } from './resolveProvenance';

export interface DeploymentGroupCategories {
  environment: string;
  region?: string;
  configType?: string;
}

export class FindSettings implements IDynamoOperation<Setting<DeploymentGroupCategories>[], DeploymentGroupCategories> {
  constructor(@inject(DynamoServices.DocClient) private readonly client: DynamoDBDocumentClient) {}

  async execute(params: DeploymentGroupCategories): Promise<Setting<DeploymentGroupCategories>[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: 'EnvironmentSettings',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':pk': resolveProvenance(params),
        },
        ScanIndexForward: false,
        Limit: 1000,
      }),
    );

    console.log('params', params);
    console.log('response', response.Items);
    console.log('provenance', resolveProvenance(params));

    if (!response.Items || response.Items.length === 0) {
      return [];
    }

    return response.Items as Setting<DeploymentGroupCategories>[];
  }
}
