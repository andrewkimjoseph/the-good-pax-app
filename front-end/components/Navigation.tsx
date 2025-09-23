import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";

export function Navigation() {
  return (
    <div className="w-full flex justify-center p-6">
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
