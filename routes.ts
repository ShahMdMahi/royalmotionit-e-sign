export const privateRoutes = [
  "/dashboard",
  "/documents",
  "/profile",
  "/settings",
  "/admin/dashboard",
  "/admin/documents",
  "/admin/profile",
  "/admin/settings",
  "/admin/users",
];

// Routes that should only be accessible to admin users
export const adminOnlyRoutes = [
  "/admin",
  "/documents/new",
  "/documents/create",
  "/documents/upload",
  "/documents/prepare",
  "/admin/documents",
  "/admin/users",
  "/admin/settings",
];
