const TAB_ROUTES = new Set(['HomeTab', 'MbooloTab', 'DiscoverTab', 'MovementTab', 'MoiTab']);

/** Open a screen from nested tab navigators — walks up to the navigator that owns the route. */
export function navigateFromRoot(navigation, name, params) {
  if (!navigation?.navigate || !name) return;

  if (TAB_ROUTES.has(name)) {
    let tabNav = navigation;
    while (tabNav) {
      const state = tabNav.getState?.();
      if (state?.routeNames?.includes(name)) {
        tabNav.navigate(name, params);
        return;
      }
      const parent = tabNav.getParent?.();
      if (!parent || parent === tabNav) break;
      tabNav = parent;
    }
  }

  let current = navigation;
  while (current) {
    const state = current.getState?.();
    if (state?.routeNames?.includes(name)) {
      current.navigate(name, params);
      return;
    }
    const parent = current.getParent?.();
    if (!parent || parent === current) break;
    current = parent;
  }

  navigation.navigate(name, params);
}
