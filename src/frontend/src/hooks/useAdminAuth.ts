const SESSION_KEY = "anthropocene_admin_session";
const ADMIN_PASSWORD = "Anthropocene@2026";

export function useAdminAuth() {
  const isAuthenticated = localStorage.getItem(SESSION_KEY) === "true";

  const login = async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
  };

  return { isAuthenticated, login, logout };
}
