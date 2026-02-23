import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI, deliveryAPI } from '../services/api';

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: '📋' },
  { key: 'PAID', label: 'Paid', icon: '💳' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: '📦' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚴' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const orderRes = await orderAPI.getById(id);
      setOrder(orderRes.data);

      try {
        const deliveryRes = await deliveryAPI.getByOrder(id);
        setDelivery(deliveryRes.data);
      } catch (e) {
        // Delivery might not exist yet
      }
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderAPI.cancel(id);
      toast.success('Order cancelled');
      fetchOrderDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusStep = (status) => {
    return STEPS.findIndex((s) => s.key === status);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-10 text-gray-500">Order not found</div>;
  }

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            isCancelled ? 'bg-red-100 text-red-700' :
            isDelivered ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="mb-4">
            <div className="flex items-center justify-between relative">
              {/* Progress bar background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 mx-8" />
              {/* Progress bar fill */}
              <div
                className="absolute top-5 left-0 h-1 bg-primary mx-8 transition-all duration-500"
                style={{ width: currentStep >= 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }}
              />

              {STEPS.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                    index <= currentStep
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {index <= currentStep ? step.icon : (index + 1)}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium ${
                    index <= currentStep ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-medium">This order has been cancelled.</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
        <div className="divide-y">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-3">
              <div>
                <span className="font-medium text-gray-800">{item.menuItemName}</span>
                <span className="text-gray-500 ml-2">x {item.quantity}</span>
              </div>
              <span className="font-medium">${item.subtotal?.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-2 pt-4 flex justify-between">
          <span className="text-lg font-bold text-gray-800">Total</span>
          <span className="text-lg font-bold text-primary">${order.totalAmount?.toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery Information */}
      {delivery && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Delivery Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-36">Status:</span>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                delivery.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {delivery.status?.replace(/_/g, ' ')}
              </span>
            </div>
            {delivery.agentName && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">Delivery Agent:</span>
                <span className="font-medium text-gray-800">{delivery.agentName}</span>
              </div>
            )}
            {delivery.estimatedDeliveryTime && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-36">Estimated Delivery:</span>
                <span className="font-medium text-gray-800">
                  {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Address */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
        <p className="text-gray-600">{order.deliveryAddress}</p>
        {order.specialInstructions && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">Special Instructions</h4>
            <p className="text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              {order.specialInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Auto-refresh notice */}
      {!isCancelled && !isDelivered && (
        <p className="text-center text-gray-400 text-sm mb-4">
          This page auto-refreshes every 10 seconds
        </p>
      )}

      {/* Cancel button */}
      {!isCancelled && currentStep < 3 && (
        <button
          onClick={handleCancelOrder}
          className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
};

export default OrderTracking;
