import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
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
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">\ud83d\udcdd</div>
          <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet.</p>
          <Link to="/restaurants" className="btn-primary">
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card block hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()} &bull; {order.items?.length || 0} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    ${order.totalAmount?.toFixed(2)}
                  </p>
                  <span className="text-xs text-gray-400">View details &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
