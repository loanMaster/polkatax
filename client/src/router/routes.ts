import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'staking-rewards',
      },
      {
        path: 'transfers',
        component: () =>
          import('src/transfers-module/components/TransfersAndSwaps.vue'),
      },
      {
        path: 'staking-rewards',
        component: () =>
          import('src/staking-rewards-module/components/StakingRewards.vue'),
      },
      {
        path: 'trades',
        component: () => import('src/swap-module/components/TokenSwaps.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () =>
      import('src/shared-module/components/error/ErrorNotFound.vue'),
  },
];

export default routes;
