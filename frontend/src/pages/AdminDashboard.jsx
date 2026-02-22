import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI, restaurantAPI, orderAPI, paymentAPI, deliveryAPI } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('statistics');
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'statistics') {
        const [usersRes, ordersRes, paymentsRes] = await Promise.all([
          authAPI.getAllUsers(),
          orderAPI.getAll(),
          paymentAPI.getAll().catch(() => ({ data: [] })),
        ]);
        setUsers(usersRes.data);
        setOrders(ordersRes.data);
        setPayments(paymentsRes.data);
      } else if (activeTab === 'users') {
        const res = await authAPI.getAllUsers();
        setUsers(res.data);
      } else if (activeTab === 'restaurants') {
        const res = await restaurantAPI.getAll();
        setRestaurants(res.data);
      } else if (activeTab === 'orders') {
        const res = await orderAPI.getAll();
        setOrders(res.data);
      } else if (activeTab === 'payments') {
        const res = await paymentAPI.getAll();
        setPayments(res.data);
      } else if (activeTab === 'agents') {
        const res = await deliveryAPI.getAllAgents();
        setAgents(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserActive = async (userId) => {
    try {
      await authAPI.toggleUserActive(userId);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleToggleRestaurant = async (restaurant) => {
    try {
      await restaurantAPI.update(restaurant.id, { ...restaurant, isActive: !restaurant.isActive });
      toast.success(`Restaurant ${restaurant.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update restaurant');
    }
  };

  const tabs = ['statistics', 'users', 'restaurants', 'orders', 'payments', 'agents'];

  const totalRevenue = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const getStatusColor = (status) => {
    const colors = {
      CREATED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      PREPARING: 'bg-yellow-100 text-yellow-800',
      OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-200 text-green-900',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize ${
              activeTab === tab ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {tab === 'agents' ? 'Delivery Agents' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          {activeTab === 'statistics' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card text-center">
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{users.length}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-primary">{orders.length}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="card text-center">
                  <p className="text-gray-600 text-sm">Delivered Orders</p>
                  <p className="text-3xl font-bold text-primary">
                    {orders.filter((o) => o.status === 'DELIVERED').length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold mb-3">Users by Role</h3>
                  {['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_AGENT', 'ADMIN'].map((role) => (
                    <div key={role} className="flex justify-between py-2 border-b last:border-b-0">
                      <span className="text-gray-600">{role.replace(/_/g, ' ')}</span>
                      <span className="font-bold">{users.filter((u) => u.role === role).length}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="font-semibold mb-3">Orders by Status</h3>
                  {['CREATED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
                    (status) => (
                      <div key={status} className="flex justify-between py-2 border-b last:border-b-0">
                        <span className={`px-2 py-0.5 rounded text-sm ${getStatusColor(status)}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold">{orders.filter((o) => o.status === status).length}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">All Users ({users.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">ID</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-left py-3">Name</th>
                      <th className="text-left py-3">Role</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3">{user.id}</td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">{user.firstName} {user.lastName}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">{user.role}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleUserActive(user.id)}
                              className={`text-sm px-3 py-1 rounded ${
                                user.isActive
                                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.isActive ? 'Block' : 'Unblock'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">All Restaurants ({restaurants.length})</h2>
              <div className="space-y-4">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm">{restaurant.cuisineType}</p>
                      <p className="text-gray-500 text-sm">{restaurant.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleRestaurant(restaurant)}
                        className="btn-primary text-sm"
                      >
                        {restaurant.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">All Orders ({orders.length})</h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <p className="text-gray-600 text-sm">User: {order.userId}</p>
                        <p className="text-gray-500 text-sm">Restaurant: {order.restaurantId}</p>
                        <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                        <p className="font-bold mt-2">${order.totalAmount?.toFixed(2)}</p>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm text-gray-600">
                            {item.menuItemName} x {item.quantity} — ${item.subtotal?.toFixed(2)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">All Payments ({payments.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">ID</th>
                      <th className="text-left py-3">Order</th>
                      <th className="text-left py-3">User</th>
                      <th className="text-left py-3">Amount</th>
                      <th className="text-left py-3">Method</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-3">{payment.id}</td>
                        <td className="py-3">#{payment.orderId}</td>
                        <td className="py-3">{payment.userId}</td>
                        <td className="py-3 font-semibold">${payment.amount?.toFixed(2)}</td>
                        <td className="py-3">{payment.paymentMethod || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm">{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Delivery Agents ({agents.length})</h2>
              {agents.length === 0 ? (
                <p className="text-gray-600">No delivery agents registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">ID</th>
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Phone</th>
                        <th className="text-left py-3">User ID</th>
                        <th className="text-left py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.id} className="border-b">
                          <td className="py-3">{agent.id}</td>
                          <td className="py-3 font-semibold">{agent.name}</td>
                          <td className="py-3">{agent.phone || 'N/A'}</td>
                          <td className="py-3">{agent.userId}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              agent.isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {agent.isAvailable ? 'Available' : 'On Delivery'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
