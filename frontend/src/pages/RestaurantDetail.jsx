import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { restaurantAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantAPI.getById(id),
        restaurantAPI.getMenu(id),
      ]);
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      toast.error('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      return;
    }
    const added = addItem(item, restaurant);
    if (added) {
      toast.success(`${item.name} added to cart`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return <div className="text-center py-10 text-gray-500">Restaurant not found</div>;
  }

  // Group menu items by category
  const categories = [...new Set(menuItems.map((item) => item.category || 'Other'))];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Restaurant Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          <div className="w-28 h-28 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.parentNode.innerHTML = '<span class="text-5xl">\ud83c\udf7d\ufe0f</span>'; }}
              />
            ) : (
              <span className="text-5xl">\ud83c\udf7d\ufe0f</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
            {restaurant.cuisineType && (
              <span className="text-xs bg-orange-50 text-primary px-2 py-0.5 rounded-full font-medium">
                {restaurant.cuisineType}
              </span>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {restaurant.address && <span>{restaurant.address}</span>}
              {restaurant.phone && <span>&bull; {restaurant.phone}</span>}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-500">\u2b50</span>
              <span className="font-semibold text-gray-700">{restaurant.rating?.toFixed(1) || 'New'}</span>
            </div>
          </div>
        </div>
        {restaurant.description && (
          <p className="mt-4 text-gray-500 border-t pt-4">{restaurant.description}</p>
        )}
      </div>

      {/* Menu */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Menu <span className="text-gray-400 font-normal text-base">({menuItems.length} items)</span>
      </h2>

      {menuItems.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">\ud83c\udf7d\ufe0f</div>
          <p className="text-gray-500">No menu items available</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems
                  .filter((item) => (item.category || 'Other') === category)
                  .map((item) => (
                    <div key={item.id} className="card p-4 flex gap-4 hover:shadow-md transition-shadow">
                      {/* Item image */}
                      <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">\ud83c\udf7d\ufe0f</div>'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">\ud83c\udf7d\ufe0f</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        {item.description && (
                          <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-primary font-bold">${item.price?.toFixed(2)}</span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                              item.isAvailable
                                ? 'bg-primary text-white hover:bg-orange-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!item.isAvailable}
                          >
                            {item.isAvailable ? '+ Add' : 'Unavailable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
