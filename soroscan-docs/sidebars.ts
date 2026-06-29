import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
import apiSidebar from '../docs/api-reference/sidebar';

const sidebars: SidebarsConfig = {
  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'generated-index',
        title: 'API Reference',
        description: 'SoroScan API endpoints',
        slug: '/category/api'
      },
      items: apiSidebar,
    }
  ],
  tutorialSidebar: [
    'getting-started',
    'api-overview',
    'ROADMAP',
    {
      type: 'category',
      label: 'SDKs',
      items: ['sdk-python', 'sdk-typescript'],
    },
    {
      type: 'category',
      label: 'Cookbook',
      items: [
        'cookbook/track-contract-events',
        'cookbook/setup-webhook',
        'cookbook/paginate-events',
        'cookbook/filter-by-event-type',
        'cookbook/monitor-contract-activity',
        'cookbook/query-transaction-events',
        'cookbook/manage-api-keys',
        'cookbook/check-rate-limits',
        'cookbook/graphql-advanced-queries',
        'cookbook/deploy-self-hosted',
        'cookbook/migrate-from-rest-to-graphql',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/docker-compose',
        'deployment/kubernetes',
        'deployment/cloud-platforms',
      ],
    },
    {
      type: 'category',
      label: 'Database & Cache',
      items: [
        'database/operations-guide',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: ['examples/query-events', 'examples/webhook-setup'],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/developer-onboarding',
        'contributing/style-guide',
        'contributing/git-and-pr-workflow',
        'contributing/documentation-guide',
        'contributing/community-standards',
      ],
    },
    'rate-limits',
    'changelog',
    'faq',
    'troubleshooting/guide',
  ],
};

export default sidebars;