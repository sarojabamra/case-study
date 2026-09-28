import Account from "@/features/account/Account";
import { RequireAuth } from "@/utils/routeGuards";

export default function AccountPage() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}
