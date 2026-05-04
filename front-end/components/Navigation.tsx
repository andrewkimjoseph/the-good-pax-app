import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";

export function Navigation() {
  return (
    <div className="flex w-full justify-center px-4 py-2">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <ConnectButton showBalance={false} accountStatus={"address"}/>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
