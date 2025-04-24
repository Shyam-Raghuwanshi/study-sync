
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserProfile from '../user-profile';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary font-bold text-xl">StudySync</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center px-6">
            {showSearch ? (
              <div className="w-full max-w-lg relative">
                <Input
                  className="w-full pl-10"
                  placeholder="Search groups, topics, or users..."
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-gray-500"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-5 w-5 mr-2" />
                <span>Search</span>
              </Button>
            )}
          </div>

          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
