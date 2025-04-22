
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  BarChart2, 
  Settings, 
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isSidebarOpen: boolean;
}

const Sidebar = ({ isSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);
  
  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Resources', icon: BookOpen, path: '/resources' },
    { name: 'Progress', icon: BarChart2, path: '/progress' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Mock data for study groups (will come from API in real implementation)
  const studyGroups = [
    { id: '1', name: 'Physics 101', path: '/groups/1' },
    { id: '2', name: 'Calculus II', path: '/groups/2' },
    { id: '3', name: 'Computer Science', path: '/groups/3' },
  ];

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-6">
          <div className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", location.pathname === item.path ? "text-white" : "text-gray-500")} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-4 py-5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <button 
              className="flex items-center text-sm font-medium text-gray-700"
              onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", isGroupsExpanded && "rotate-90")} />
              <span className="ml-2">Study Groups</span>
            </button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <PlusCircle className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {isGroupsExpanded && (
            <div className="ml-2 space-y-1">
              {studyGroups.map((group) => (
                <Link
                  key={group.id}
                  to={group.path}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location.pathname === group.path
                      ? "bg-gray-100 text-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Users className="mr-3 h-4 w-4 text-gray-500" />
                  <span className="truncate">{group.name}</span>
                </Link>
              ))}
              
              <Link
                to="/groups"
                className="flex items-center px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded-md"
              >
                <span>View all groups</span>
              </Link>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-200">
          <Button className="w-full" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Study Group
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
