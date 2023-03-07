import { createContainer, IServiceContainer } from '@aesop-fables/containr';
import { Setting } from '../CascadingSettings';
import { DeploymentGroupCategories } from '../FindSettings';
import AWS, { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
import { DynamoServices, IDynamoService, useDynamo } from '@aesop-fables/containr-dynamofx';
import { DynamoDbSettingsSource } from '../DynamoDbSettingsSource';

class TableFactory {
  readonly tableName: string;

  constructor(private readonly params: CreateTableInput) {
    this.tableName = params.TableName ?? '';
    if (!this.tableName || !this.tableName.length) {
      throw new Error('Table name not specified');
    }
  }

  async createTable(dynamoDb: DynamoDB): Promise<void> {
    console.log(`creatign ${this.tableName}`, this.params);
    await dynamoDb.createTable(this.params).promise();
  }

  async deleteTable(dynamoDb: DynamoDB): Promise<void> {
    console.log(`deleting ${this.tableName}`);
    await dynamoDb.deleteTable({ TableName: this.tableName }).promise();
  }
}

export interface SettingsStateExpression {
  foo?: string;
  bar?: string;
}

export interface RegionStateExpression extends SettingsStateExpression {
  myApp?: SettingsStateExpression;
}

export interface EnvironmentStateExpression extends SettingsStateExpression {
  region01?: RegionStateExpression;
  region02?: RegionStateExpression;
}

export interface SystemStateExpression {
  env01: EnvironmentStateExpression;
  env02: EnvironmentStateExpression;
}

export interface ScenarioResult {
  container: IServiceContainer;
  executeSource: (params: DeploymentGroupCategories) => Promise<Setting<DeploymentGroupCategories>[]>;
}

const params: CreateTableInput = {
  TableName: 'EnvironmentSettings',

  KeySchema: [
    {
      AttributeName: 'pk',
      KeyType: 'HASH',
    },
    {
      AttributeName: 'key',
      KeyType: 'RANGE',
    },
  ],

  AttributeDefinitions: [
    {
      AttributeName: 'pk',
      AttributeType: 'S',
    },
    {
      AttributeName: 'key',
      AttributeType: 'S',
    },
  ],

  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
};

const settingsFactory = new TableFactory(params);

// TESTING ONLY
AWS.config.update({ region: 'REGION' });
const endpoint = process.env.DYNAMO_DB_ENDPOINT || 'http://localhost:8000';
const dynamoDb = new AWS.DynamoDB({ endpoint });

async function clearDatabase() {
  try {
    await settingsFactory.deleteTable(dynamoDb);
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}

async function buildDatabase() {
  await settingsFactory.createTable(dynamoDb);
}

export async function resetDatabase() {
  await clearDatabase();
  await buildDatabase();
}

async function saveSetting(provenance: string, key: string, value: string): Promise<void> {
  await dynamoDb
    .putItem({
      TableName: 'EnvironmentSettings',
      Item: {
        pk: {
          S: provenance,
        },
        key: {
          S: key,
        },
        value: {
          S: value,
        },
      },
    })
    .promise();
}

async function processExpression(provenance: string, expression?: SettingsStateExpression): Promise<void> {
  if (expression?.foo) {
    await saveSetting(provenance, 'foo', expression.foo);
  }

  if (expression?.bar) {
    await saveSetting(provenance, 'bar', expression.bar);
  }
}

async function processConfigType(
  env: string,
  region: string,
  configType: string,
  expression?: EnvironmentStateExpression,
): Promise<void> {
  if (!expression) {
    return;
  }

  await processExpression(`${env}#${region}#${configType}`, expression);
}

async function processRegion(env: string, region: string, expression?: RegionStateExpression): Promise<void> {
  if (!expression) {
    return;
  }

  await processExpression(`${env}#${region}`, expression);

  if (expression.myApp) {
    await processConfigType(env, region, 'myApp', expression);
  }
}

async function processEnv(env: string, expression?: EnvironmentStateExpression): Promise<void> {
  console.log(env, expression);
  if (!expression) {
    return;
  }

  await processExpression(env, expression);

  await processRegion(env, 'region01', expression.region01);
  await processRegion(env, 'region02', expression.region02);
}

export async function executeExpression(expression: SystemStateExpression): Promise<void> {
  await processEnv('env01', expression.env01);
  await processEnv('env02', expression.env02);
}

export async function resetSystemState(expression: SystemStateExpression): Promise<ScenarioResult> {
  await resetDatabase();
  await executeExpression(expression);

  const container = createContainer([
    useDynamo({
      core: {
        endpoint,
      },
    }),
  ]);

  const dynamo = container.get<IDynamoService>(DynamoServices.Service);

  return {
    container,
    executeSource(params) {
      const source = new DynamoDbSettingsSource(params, dynamo);
      return source.loadSettings();
    },
  };
}
