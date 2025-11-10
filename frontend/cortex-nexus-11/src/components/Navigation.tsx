import { Home, Network, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/graph", label: "Graph" },
    { to: "/assistant", label: "Assistant" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Nav Items */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground hidden sm:block">
                ResearchGraph
              </span>
            </NavLink>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-colors text-sm font-medium",
                      isActive
                        ? "text-foreground bg-accent/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                    )}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Right: User Section */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-accent/5 transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">V</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              Veeresh
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
