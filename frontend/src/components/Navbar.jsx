import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    const dashboards = {
      ADMIN: { to: '/admin', label: 'Admin' },
      RESTAURANT_OWNER: { to: '/restaurant-dashboard', label: 'My Restaurant' },
      DELIVERY_AGENT: { to: '/delivery-dashboard', label: 'Deliveries' },
    };
    const d = dashboards[user.role];
    if (!d) return null;
    return (
      <Link to={d.to} className="text-gray-600 hover:text-primary font-medium">
        {d.label}
      </Link>
    );
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">F</span>
            FoodDelivery
          </Link>

          <div className="flex items-center gap-5">
            <Link to="/restaurants" className="text-gray-600 hover:text-primary font-medium">
              Restaurants
            </Link>

            {isAuthenticated ? (
              <>
                {getDashboardLink()}

                {user?.role === 'CUSTOMER' && (
                  <>
                    <Link to="/orders" className="text-gray-600 hover:text-primary font-medium">
                      Orders
                    </Link>
                    <Link to="/cart" className="relative text-gray-600 hover:text-primary">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      {getItemCount() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {getItemCount()}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-600 font-medium hidden md:inline">
                    {user?.firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-500 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-primary font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
