import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserProfile from '../user-profile';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Search for groups with the current term
  const searchResults = useQuery(api.studyGroups.searchByName, 
    debouncedSearchTerm ? { searchTerm: debouncedSearchTerm } : 'skip'
  );

  // Handle debounced search term
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        setDebouncedSearchTerm(searchTerm);
        setShowResults(true);
      } else {
        setDebouncedSearchTerm('');
        setShowResults(false);
      }
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Set searching state based on search results
  useEffect(() => {
    if (searchResults !== undefined) {
      setIsSearching(false);
    }
  }, [searchResults]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle navigation to a group
  const handleNavigateToGroup = (groupId: string) => {
    navigate(`/groups/${groupId}`);
    setShowResults(false);
    setSearchTerm('');
    setShowSearch(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
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

          <div className="hidden md:flex flex-1 items-center justify-center px-6 relative">
            {showSearch ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    className="pl-10 pr-10 bg-gray-50 focus-visible:ring-primary"
                    placeholder="Search groups by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    onFocus={() => setShowResults(!!searchTerm)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                  />
                  {searchTerm && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {showResults && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
                        <span className="text-gray-500">Searching...</span>
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <div>
                        {searchResults.map((group) => (
                          <div
                            key={group._id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleNavigateToGroup(group._id)}
                          >
                            <div className="font-medium">{group.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {group.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm && !isSearching ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        No groups found matching "{searchTerm}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-gray-500 hover:bg-gray-100"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-5 w-5 mr-2" />
                <span>Search Groups</span>
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
