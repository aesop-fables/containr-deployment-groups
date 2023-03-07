import { createContainer, createServiceModule } from '@aesop-fables/containr';

export * from './ServerConfig';

export const useServerConfig = createServiceModule('@aesop-fables/containr/deployment-groups', (services) => {
  // Expose options so that each consumer can specify:
  // 1. Whether the env/region/conifgType are coming from env variables or if they're hardcoded
  // 2. If they're coming from env vars, we need to be able to pass along var names and default values
  // 3. Should we also allow for some validation here?
  console.log(services);
});

const container = createContainer([useServerConfig]);
console.log(container);
