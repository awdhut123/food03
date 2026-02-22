import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="card">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Payment Cancelled</h1>
        <p className="text-gray-500 mb-1">Your payment was not completed.</p>
        {orderId && (
          <p className="text-gray-400 text-sm mb-6">Order #{orderId} is still pending.</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/cart')} className="btn-primary">
            Return to Cart
          </button>
          <button
            onClick={() => navigate('/restaurants')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
