import 'reflect-metadata';
import { resetSystemState } from './Utils';

describe('DynamoDbSettingsSource', () => {
  describe('When only environment-level settings exist', () => {
    describe('and we are querying by environment', () => {
      test('Returns all matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01' });
        expect(settings.length).toBe(2);

        const foo = settings.find((x) => x.key === 'foo');
        expect(foo?.value).toEqual('bar');

        const bar = settings.find((x) => x.key === 'bar');
        expect(bar?.value).toEqual('foo');
      });
    });

    describe('and we are querying by environment and region', () => {
      test('Results in no matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01', region: 'us-west-2' });
        expect(settings.length).toBe(0);
      });
    });

    describe('and we are querying by environment, region, and configType', () => {
      test('Results in no matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01', region: 'us-west-2', configType: 'test' });
        expect(settings.length).toBe(0);
      });
    });
  });

  describe('When environment and region-level settings exist', () => {
    describe('and we are querying by environment', () => {
      test('Results in no matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01', region: 'region01' });
        expect(settings.length).toBe(0);
      });
    });

    describe('and we are querying by environment and region', () => {
      test('Returns all matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
            region01: {
              foo: 'bar$1',
              bar: 'foo$1',
            },
            region02: {
              foo: 'bar$2',
              bar: 'foo$2',
            },
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01', region: 'region02' });
        expect(settings.length).toBe(2);

        const foo = settings.find((x) => x.key === 'foo');
        expect(foo?.value).toEqual('bar$2');

        const bar = settings.find((x) => x.key === 'bar');
        expect(bar?.value).toEqual('foo$2');
      });
    });

    describe('and we are querying by environment, region, and configType', () => {
      test('Results in no matching settings', async () => {
        const { executeSource } = await resetSystemState({
          env01: {
            foo: 'bar',
            bar: 'foo',
          },
          env02: {
            foo: 'barbar',
          },
        });

        const settings = await executeSource({ environment: 'env01', region: 'us-west-2', configType: 'test' });
        expect(settings.length).toBe(0);
      });
    });
  });
});
