import { resolveEnvironmentSettings } from '../resolveEnvironmentSettings';

interface TestSettings {
  foo: string;
}

describe('resolveEnvironmentSettings', () => {
  test('resolves value when found', () => {
    process.env.FOO = 'bar';

    const settings = resolveEnvironmentSettings<TestSettings>({
      foo: {
        variable: 'FOO',
        defaultValue: 'foo',
      },
    });

    expect(settings.foo).toBe('bar');
  });

  test('uses default value when variable is not found', () => {
    delete process.env.FOO;

    const settings = resolveEnvironmentSettings<TestSettings>({
      foo: {
        variable: 'FOO',
        defaultValue: 'foo',
      },
    });

    expect(settings.foo).toBe('foo');
  });
});
