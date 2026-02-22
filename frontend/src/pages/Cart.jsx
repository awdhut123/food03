import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';

const Cart = () => {
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, getTotal } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.id,
          menuItemName: item.name,
          quantity: item.quantity,
        })),
        deliveryAddress,
        specialInstructions,
        paymentMethod: 'CARD',
      };

      const response = await orderAPI.create(orderData);
      clearCart();

      if (response.data.checkoutUrl) {
        // Redirect to Stripe Checkout (or simulated checkout)
        window.location.href = response.data.checkoutUrl;
      } else {
        // Fallback: if no checkout URL, go to order tracking
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="btn-primary"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
      <p className="text-gray-600 mb-8">From {restaurantName}</p>

      <div className="card mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center py-4 border-b last:border-b-0"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-primary">${item.price?.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              <span className="font-semibold w-20 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Delivery Address *</label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="input-field"
            rows={2}
            placeholder="Enter your delivery address"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="input-field"
            rows={2}
            placeholder="Any special requests?"
          />
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Total</span>
          <span className="text-2xl font-bold text-primary">
            ${getTotal().toFixed(2)}
          </span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="btn-primary w-full py-3 text-lg"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
