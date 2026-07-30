import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Use local schema file for development, or set GRAPHQL_ENDPOINT env var for remote
  schema: process.env.GRAPHQL_ENDPOINT || 'src/schema.graphql',
  documents: [
    'src/**/*.graphql',
    'app/**/*.graphql',
    'components/**/*.graphql',
    '!components/notifications/**/*.graphql',
  ],
  generates: {
    './src/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
      config: {
        useTypeImports: true,
      },
    },
    './src/generated/legacy-types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
      ],
      config: {
        skipTypename: false,
        withHooks: false,
        withHOC: false,
        withComponent: false,
        useTypeImports: true,
        noExport: false,
      },
    },
    './src/generated/apollo-hooks.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        useTypeImports: true,
        skipTypename: false,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
