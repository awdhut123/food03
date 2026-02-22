import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI, orderAPI } from '../services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (orderId && sessionId) {
      verifyAndConfirm();
    } else if (orderId) {
      confirmAndRedirect();
    } else {
      setStatus('error');
    }
  }, [orderId, sessionId]);

  const confirmAndRedirect = async () => {
    try {
      await orderAPI.confirm(orderId);
      setStatus('success');
      toast.success('Payment successful! Your order is confirmed.');
      setTimeout(() => navigate(`/orders/${orderId}`), 2000);
    } catch (error) {
      setStatus('success');
      setTimeout(() => navigate(`/orders/${orderId}`), 2000);
    }
  };

  const verifyAndConfirm = async () => {
    try {
      const verifyRes = await paymentAPI.verify(sessionId);

      if (verifyRes.data.status === 'COMPLETED') {
        await orderAPI.confirm(orderId);
        setStatus('success');
        toast.success('Payment successful! Your order is confirmed.');
        setTimeout(() => navigate(`/orders/${orderId}`), 2000);
      } else {
        setStatus('error');
        toast.error('Payment verification failed.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      try {
        await orderAPI.confirm(orderId);
        setStatus('success');
        toast.success('Order confirmed!');
        setTimeout(() => navigate(`/orders/${orderId}`), 2000);
      } catch (confirmError) {
        setStatus('error');
        toast.error('Failed to confirm order.');
      }
    }
  };

  if (status === 'verifying') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="card">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3 text-gray-800">Verifying Payment...</h1>
            <p className="text-gray-500">Please wait while we confirm your payment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="card">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-800">Payment Verification Failed</h1>
          <p className="text-gray-500 mb-6">
            We couldn't verify your payment. Please contact support.
          </p>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="card">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-green-700">Payment Successful!</h1>
        <p className="text-gray-600 mb-1">Your order has been confirmed.</p>
        <p className="text-gray-400 text-sm mb-6">Order #{orderId}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 text-sm">Redirecting to order tracking in a moment...</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/orders/${orderId}`)} className="btn-primary">
            Track Order Now
          </button>
          <button
            onClick={() => navigate('/restaurants')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
