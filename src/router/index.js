import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    name: "login",
    component: () => import("../pages/requestor/Login.vue"),
  },

  // Requestor
  {
    path: "/requestor/dashboard",
    name: "requestor-dashboard",
    component: () => import("../pages/requestor/Dashboard.vue"),
  },
  {
    path: "/requestor/requests",
    name: "requestor-requests",
    component: () => import("../pages/requestor/RequestList.vue"),
  },
  {
    path: "/requestor/requests/create",
    name: "requestor-create",
    component: () => import("../pages/requestor/CreateRequest.vue"),
  },
  {
    path: "/requestor/requests/:id",
    name: "requestor-detail",
    component: () => import("../pages/requestor/RequestDetail.vue"),
  },
  {
    path: "/requestor/client-reviews-list",
    name: "requestor-client-reviews",
    component: () => import("../pages/requestor/ClientReviewList.vue"),
  },
  {
    path: "/requestor/client-reviews/:taskId?",
    name: "requestor-client-review-detail",
    component: () => import("../pages/requestor/F02-Clientreviewdetail.vue"),
  },
  {
    path: "/requestor/history",
    name: "requestor-history",
    component: () => import("../pages/requestor/History.vue"),
  },

  // Team Legal
  {
    path: "/legal/dashboard",
    name: "legal-dashboard",
    component: () => import("../pages/legal/Dashboard.vue"),
  },
  {
    path: "/legal/validation",
    name: "legal-validation-queue",
    component: () => import("../pages/legal/ValidationQueue.vue"),
  },
  {
    path: "/legal/validation/:id",
    name: "legal-validation-detail",
    component: () => import("../pages/legal/ValidationDetail.vue"),
  },
  {
    path: "/legal/tasks",
    name: "legal-review-tasks",
    component: () => import("../pages/legal/ReviewTasks.vue"),
  },
  {
    path: "/legal/reviews",
    name: "legal-my-reviews",
    component: () => import("../pages/legal/MyReviews.vue"),
  },
  {
    path: "/legal/reviews/:taskId",
    name: "legal-review-detail",
    component: () => import("../pages/legal/ReviewDetail.vue"),
  },
  {
    path: "/legal/history",
    name: "legal-history",
    component: () => import("../pages/legal/History.vue"),
  },

  // Collaborator
  {
    path: "/collaborator/dashboard",
    name: "collaborator-dashboard",
    component: () => import("../pages/collaborator/Dashboard.vue"),
  },
  {
    path: "/collaborator/tasks",
    name: "collaborator-tasks",
    component: () => import("../pages/collaborator/TaskList.vue"),
  },
  {
    path: "/collaborator/tasks/:taskId",
    name: "collaborator-task-detail",
    component: () => import("../pages/collaborator/ReviewDetail.vue"),
  },
  {
    path: "/collaborator/internal-review/:taskId?",
    name: "collaborator-internal-review",
    component: () => import("../pages/collaborator/ReviewInternalProcess.vue"),
  },
  {
    path: "/collaborator/history",
    name: "collaborator-history",
    component: () => import("../pages/collaborator/History.vue"),
  },

  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
