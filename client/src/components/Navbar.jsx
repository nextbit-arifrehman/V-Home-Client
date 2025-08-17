import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, Building, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out of your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await logout();
        navigate("/");
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to log out. Please try again.',
          icon: 'error'
        });
      }
    }
  };

  const NavLinks = ({ mobile = false, onClose = () => {} }) => (
    <>
      <Link to="/">
        <Button 
          variant="ghost" 
          className={`${mobile ? 'w-full justify-start' : ''} text-neutral-700 hover:text-primary`}
          onClick={onClose}
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </Link>
      
      <Link to="/all-properties">
        <Button 
          variant="ghost" 
          className={`${mobile ? 'w-full justify-start' : ''} text-neutral-700 hover:text-primary`}
          onClick={onClose}
        >
          <Building className="w-4 h-4 mr-2" />
          All Properties
        </Button>
      </Link>
      
      {user && (
        <>
          <Link to="/dashboard">
            <Button 
              variant="ghost" 
              className={`${mobile ? 'w-full justify-start' : ''} text-neutral-700 hover:text-primary`}
              onClick={onClose}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link to="/">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <Home className="text-white text-xl" />
              </div>
              <div>
                <h1 className="font-inter font-bold text-2xl text-neutral-900 group-hover:text-primary transition-colors">RealEstate Pro</h1>
                <p className="text-sm text-neutral-500 font-medium">Your Dream Property</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavLinks />
            
            {/* User Authentication */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-primary text-white font-semibold">
                          {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.displayName || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.role && (
                          <p className="text-xs text-primary capitalize">{user.role}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-neutral-700 hover:text-primary hover:bg-primary/5 px-6 py-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="text-neutral-700 hover:text-primary hover:bg-primary/5 px-6 py-2">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                  <NavLinks mobile onClose={() => setIsOpen(false)} />
                  
                  {user ? (
                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName || "User"}</p>
                          <p className="text-sm text-neutral-600">{user.email}</p>
                          {user.role && (
                            <p className="text-xs text-primary capitalize">{user.role}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t space-y-2">
                      <Link to="/login">
                        <Button 
                          variant="outline" 
                          className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={() => setIsOpen(false)}
                        >
                          Login
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button 
                          className="w-full bg-primary hover:bg-blue-700"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
