import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/components/main/MainPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/components/error/ErrorNotFound.vue'),
  },
];

export default routes;
