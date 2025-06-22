import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Link } from '@tanstack/react-router';

export default function Header() {
	return (
		<NavigationMenu className="px-4 py-2" viewport={false}>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						<Link to="/">Home</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>List</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-4">
							<li>
								<NavigationMenuLink asChild>
									<Link className="text-nowrap" to="/calling" search={{ callRole: 'caller' }}>
										As caller
									</Link>
								</NavigationMenuLink>
								<NavigationMenuLink asChild>
									<Link className="text-nowrap" to="/calling" search={{ callRole: 'callee' }}>
										As callee
									</Link>
								</NavigationMenuLink>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
