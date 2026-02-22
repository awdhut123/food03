import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantAPI } from '../services/api';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantAPI.getAll();
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchRestaurants();
      return;
    }
    try {
      const response = await restaurantAPI.search(searchQuery);
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error searching restaurants:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Restaurants</h1>
        <span className="text-gray-400 text-sm">{restaurants.length} available</span>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants or cuisines..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </div>
      </form>

      {restaurants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">\ud83c\udfea</div>
          <p className="text-gray-500 text-lg">No restaurants found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/restaurants/${restaurant.id}`}
              className="card p-0 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                {restaurant.imageUrl ? (
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.parentNode.innerHTML = '<div class="text-6xl">\ud83c\udf7d\ufe0f</div>'; }}
                  />
                ) : (
                  <span className="text-6xl">\ud83c\udf7d\ufe0f</span>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{restaurant.name}</h3>
                {restaurant.cuisineType && (
                  <span className="text-xs bg-orange-50 text-primary px-2 py-0.5 rounded-full font-medium">
                    {restaurant.cuisineType}
                  </span>
                )}
                <p className="text-sm text-gray-500 mt-2">{restaurant.address}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">\u2b50</span>
                    <span className="text-sm font-semibold text-gray-700">{restaurant.rating?.toFixed(1) || 'New'}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {restaurant.menuItems?.length || 0} items
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Restaurants;
