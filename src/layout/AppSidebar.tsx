import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Icon components imported from the project's icon collection
import {
  ChevronDownIcon,
  HorizontaLDots,
  PageIcon,
  GridIcon,
} from "../icons";
// Sidebar context provides global sidebar state (expanded, hovered, mobile open)
import { useSidebar } from "../context/SidebarContext";

/*
 Type: NavItem
 - name: label shown in the UI
 - icon: JSX icon node
 - path: optional route path for direct links
 - subItems: optional array of sub-menu items (name, path, optional flags)
*/
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

/*
 Navigation items for the sidebar. This is a small, local configuration.
 You can move this to a separate file if you'd like to manage routes centrally.
*/
const navItems: NavItem[] = [
  {
    icon: <GridIcon />, // Home icon
    name: "Home",
    path: "/",
  },
  {
    icon: <PageIcon />, // Report/Pages grouping with a submenu
    name: "Reportes",
    subItems: [
     // { name: "Prueba", path: "/blank", pro: false },
      { name: "Mis reportes", path: "/MyReporte", new: false },
    ],
  },
];

// Placeholder for additional (other) items that could be rendered separately
const othersItems: NavItem[] = [];

/*
 AppSidebar component
 - Renders the fixed left sidebar with logo and navigation items
 - Handles expanded/collapsed UI, hover-expansion and mobile open/close
 - Controls submenu open/close and animated height transitions
*/
const AppSidebar: React.FC = () => {
  // Values from SidebarContext (global UI state for the sidebar)
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  // Router location used to determine active links
  const location = useLocation();

  /*
    openSubmenu: keeps track of which submenu is open.
    - null means no submenu open
    - otherwise an object with type ('main' | 'others') and the index of the item
  */
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  /*
    subMenuHeight: stores measured heights (in px) for each submenu keyed by
    "{menuType}-{index}" so we can animate height from 0 -> measured px.
  */
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );

  // DOM refs for each submenu container to read scrollHeight
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Determine whether a path is active (simple exact match)
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  /*
    Effect: on location change, find if the current path is inside any submenu
    If a match is found, open that submenu automatically so the current page
    is visible in the menu.
  */
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      // Close submenus if current location isn't inside any submenu
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  /*
    Effect: when a submenu becomes open, measure its content height and save
    it so that we can animate the container's `height` property from 0 -> px.
  */
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  /*
    Toggle handler for submenus. If the clicked menu is already open it will
    close it, otherwise it will open the selected submenu.
  */
  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  /*
    renderMenuItems: renders a list of NavItem entries. Handles both items with
    direct `path` links and items that have `subItems` (collapsible groups).
  */
  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            // Item with collapsible submenu
            <>
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                {/* Icon for the menu item */}
                <span
                  className={`menu-item-icon-size  ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {/* Label only visible when sidebar expanded/hovered or on mobile open */}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {/* Chevron indicates open/close and rotates when open */}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>

              {/*
                Collapsible container for subitems. We render and measure this
                element (via ref) to animate its height from 0 -> measured px.
              */}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {/* Optional badges */}
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Regular item without submenu - direct Link
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  /*
    Main sidebar markup.
    - Width and translate-x behavior controlled by context flags for responsive
      and expanded/collapsed behavior.
    - onMouseEnter / onMouseLeave change hover state so the sidebar can expand
      temporarily when hovered (if not explicitly expanded).
  */
  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo area: shows full logo when expanded/hovered/mobile open, otherwise icon */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Navigation container with scrollable region */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              {/* Section heading: shows 'Menu' when expanded otherwise an icon */}
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>

              {/* Render main nav items */}
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
