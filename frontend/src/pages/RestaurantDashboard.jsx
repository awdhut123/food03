import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { restaurantAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_MENU_FORM = {
  name: '', description: '', price: '', category: '', imageUrl: '', isAvailable: true,
};

const EMPTY_RESTAURANT_FORM = {
  name: '', description: '', address: '', phone: '', cuisineType: '', imageUrl: '',
};

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Menu form state
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);

  // Restaurant creation form
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT_FORM);
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  useEffect(() => {
    if (!restaurant) return;
    // Auto-refresh orders every 15s
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [restaurant]);

  const fetchRestaurantData = async () => {
    try {
      const res = await restaurantAPI.getByOwner(user.userId);
      if (res.data) {
        setRestaurant(res.data);
        await Promise.all([fetchMenu(res.data.id), fetchOrdersForRestaurant(res.data.id)]);
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async (restaurantId) => {
    try {
      const res = await restaurantAPI.getMenu(restaurantId || restaurant?.id);
      setMenuItems(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchOrdersForRestaurant = async (restaurantId) => {
    try {
      const res = await orderAPI.getByRestaurant(restaurantId || restaurant?.id);
      setOrders(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchOrders = () => {
    if (restaurant?.id) fetchOrdersForRestaurant(restaurant.id);
  };

  // ---------- Restaurant Creation ----------
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setCreatingRestaurant(true);
    try {
      const res = await restaurantAPI.create({ ...restaurantForm, ownerId: user.userId });
      setRestaurant(res.data);
      toast.success('Restaurant created successfully!');
      setRestaurantForm(EMPTY_RESTAURANT_FORM);
    } catch (error) {
      toast.error('Failed to create restaurant');
    } finally {
      setCreatingRestaurant(false);
    }
  };

  // ---------- Menu Management ----------
  const handleMenuFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...menuForm,
      price: parseFloat(menuForm.price),
    };

    try {
      if (editingMenuItemId) {
        await restaurantAPI.updateMenuItem(restaurant.id, editingMenuItemId, payload);
        toast.success('Menu item updated');
      } else {
        await restaurantAPI.addMenuItem(restaurant.id, payload);
        toast.success('Menu item added');
      }
      resetMenuForm();
      fetchMenu(restaurant.id);
    } catch (error) {
      toast.error('Failed to save menu item');
    }
  };

  const handleEditMenuItem = (item) => {
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    setEditingMenuItemId(item.id);
    setShowMenuForm(true);
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await restaurantAPI.deleteMenuItem(restaurant.id, itemId);
      toast.success('Menu item deleted');
      fetchMenu(restaurant.id);
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await restaurantAPI.updateMenuItem(restaurant.id, item.id, {
        isAvailable: !item.isAvailable,
      });
      toast.success(`${item.name} ${item.isAvailable ? 'hidden' : 'available'}`);
      fetchMenu(restaurant.id);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const resetMenuForm = () => {
    setShowMenuForm(false);
    setMenuForm(EMPTY_MENU_FORM);
    setEditingMenuItemId(null);
  };

  // ---------- Order Management ----------
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      const messages = {
        CONFIRMED: 'Order confirmed by restaurant',
        PREPARING: 'Order is being prepared',
        READY_FOR_PICKUP: 'Order marked as ready for pickup. Delivery agent will be notified.',
      };
      toast.success(messages[status] || 'Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-700',
      CREATED: 'bg-blue-100 text-blue-700',
      PAID: 'bg-emerald-100 text-emerald-700',
      CONFIRMED: 'bg-teal-100 text-teal-700',
      PREPARING: 'bg-yellow-100 text-yellow-700',
      READY_FOR_PICKUP: 'bg-orange-100 text-orange-700',
      OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getOrderAction = (order) => {
    switch (order.status) {
      case 'PAID':
        return { label: 'Confirm Order', status: 'CONFIRMED', color: 'bg-teal-500 hover:bg-teal-600' };
      case 'CONFIRMED':
        return { label: 'Start Preparing', status: 'PREPARING', color: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'PREPARING':
        return { label: 'Ready for Pickup', status: 'READY_FOR_PICKUP', color: 'bg-orange-500 hover:bg-orange-600' };
      default:
        return null;
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------- No Restaurant - Show Creation Form ----------
  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Your Restaurant</h1>
          <p className="text-gray-500 mb-6">Set up your restaurant to start receiving orders.</p>

          <form onSubmit={handleCreateRestaurant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                value={restaurantForm.name}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Pizza Palace"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={restaurantForm.description}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Tell customers about your restaurant..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={restaurantForm.address}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                  className="input-field"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="text"
                  value={restaurantForm.phone}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                <input
                  type="text"
                  value={restaurantForm.cuisineType}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisineType: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Italian, Chinese"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={restaurantForm.imageUrl}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, imageUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingRestaurant}
              className="btn-primary w-full py-3 text-lg"
            >
              {creatingRestaurant ? 'Creating...' : 'Create Restaurant'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Main Dashboard ----------
  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
            <p className="text-gray-500 mt-1">
              {restaurant.cuisineType && <span>{restaurant.cuisineType} &bull; </span>}
              {restaurant.address}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'orders', label: 'Orders', count: activeOrders.length },
          { key: 'menu', label: 'Menu', count: menuItems.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========== ORDERS TAB ========== */}
      {activeTab === 'orders' && (
        <div>
          {/* Active Orders */}
          <h2 className="text-lg font-bold text-gray-800 mb-3">Active Orders ({activeOrders.length})</h2>
          {activeOrders.length === 0 ? (
            <div className="card text-center py-12 mb-6">
              <div className="text-4xl mb-3">\ud83d\udccb</div>
              <p className="text-gray-500">No active orders at the moment.</p>
              <p className="text-gray-400 text-sm mt-1">Orders auto-refresh every 15 seconds</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {activeOrders.map((order) => {
                const action = getOrderAction(order);
                return (
                  <div key={order.id} className="card border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">${order.totalAmount?.toFixed(2)}</span>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between py-1 text-sm">
                          <span className="text-gray-700">{item.menuItemName} x {item.quantity}</span>
                          <span className="text-gray-500">${item.subtotal?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <p className="text-sm text-gray-500 mb-3">
                        <span className="font-medium">Deliver to:</span> {order.deliveryAddress}
                      </p>
                    )}

                    {action && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, action.status)}
                        className={`w-full py-2.5 text-white rounded-lg font-semibold transition-colors ${action.color}`}
                      >
                        {action.label}
                      </button>
                    )}

                    {order.status === 'READY_FOR_PICKUP' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                        <p className="text-orange-700 text-sm font-medium">
                          Waiting for delivery agent to pick up...
                        </p>
                      </div>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <p className="text-purple-700 text-sm font-medium">
                          Order is on the way to customer
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Completed ({completedOrders.length})</h2>
              <div className="space-y-3">
                {completedOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="card opacity-75">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-700">Order #{order.id}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="font-bold text-gray-600">${order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========== MENU TAB ========== */}
      {activeTab === 'menu' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Menu Items</h2>
            <button
              onClick={() => {
                if (showMenuForm && !editingMenuItemId) {
                  resetMenuForm();
                } else {
                  resetMenuForm();
                  setShowMenuForm(true);
                }
              }}
              className="btn-primary"
            >
              {showMenuForm && !editingMenuItemId ? 'Cancel' : '+ Add Item'}
            </button>
          </div>

          {/* Menu Form (Add / Edit) */}
          {showMenuForm && (
            <div className="card mb-6 border-2 border-primary/20">
              <h3 className="font-semibold text-gray-800 mb-4">
                {editingMenuItemId ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <form onSubmit={handleMenuFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Margherita Pizza"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                      className="input-field"
                      placeholder="9.99"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Pizza, Drinks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={menuForm.imageUrl}
                      onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Describe this dish..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuForm.isAvailable}
                      onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                  <span className="text-sm text-gray-700">Available</span>
                </div>

                {/* Image preview */}
                {menuForm.imageUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={menuForm.imageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-sm text-gray-500">Image preview</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">
                    {editingMenuItemId ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingMenuItemId && (
                    <button type="button" onClick={resetMenuForm} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Menu Items List */}
          {menuItems.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">\ud83c\udf7d\ufe0f</div>
              <p className="text-gray-500">No menu items yet. Add your first item!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id} className={`card flex items-center gap-4 ${
                  !item.isAvailable ? 'opacity-60' : ''
                }`}>
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">\ud83c\udf7d\ufe0f</div>'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">\ud83c\udf7d\ufe0f</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                      {item.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{item.category}</span>
                      )}
                      {!item.isAvailable && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">Hidden</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-500 text-sm truncate">{item.description}</p>
                    )}
                    <p className="text-primary font-bold mt-1">${item.price?.toFixed(2)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Availability toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      title={item.isAvailable ? 'Hide item' : 'Show item'}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        item.isAvailable
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {item.isAvailable ? '\u2705' : '\u274c'}
                    </button>
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                      title="Edit"
                    >
                      \u270f\ufe0f
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                      title="Delete"
                    >
                      \ud83d\uddd1\ufe0f
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
