import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Dynamically load Leaflet CSS
const loadLeafletCSS = () => {
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
};

// Simple map component using leaflet
const DeliveryMap = ({ deliveryAddress }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    loadLeafletCSS();
    let cancelled = false;

    const initMap = async () => {
      const L = await import('leaflet');

      if (cancelled || !mapRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Default center (Mumbai, India)
      let lat = 19.076;
      let lng = 72.8777;

      // Try geocoding the delivery address
      if (deliveryAddress) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`
          );
          const data = await res.json();
          if (data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (e) {
          // Use default coords
        }
      }

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([lat, lng], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Customer location marker
      L.marker([lat, lng]).addTo(map).bindPopup('Delivery Location').openPopup();

      // Restaurant marker (slightly offset for demo)
      const restaurantIcon = L.divIcon({
        html: '<div style="background:#FF6B35;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">R</div>',
        iconSize: [30, 30],
        className: '',
      });
      L.marker([lat + 0.005, lng - 0.003], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup('Restaurant');
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [deliveryAddress]);

  return <div ref={mapRef} style={{ height: '300px', borderRadius: '8px' }} />;
};

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      if (activeTab === 'available') {
        const res = await deliveryAPI.getAvailable();
        setAvailableDeliveries(res.data);
      } else {
        const res = await deliveryAPI.getMyDeliveries();
        setMyDeliveries(res.data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId) => {
    try {
      await deliveryAPI.accept(deliveryId);
      toast.success('Delivery accepted! Order is now out for delivery.');
      setActiveTab('my');
      fetchDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept delivery');
    }
  };

  const handleUpdateStatus = async (deliveryId, status) => {
    try {
      await deliveryAPI.updateStatus(deliveryId, status);
      const msg = status === 'DELIVERED' ? 'Delivery completed!' : 'Status updated';
      toast.success(msg);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openGoogleMaps = (address) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ASSIGNED: 'bg-blue-100 text-blue-700',
      PICKED_UP: 'bg-indigo-100 text-indigo-700',
      IN_TRANSIT: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextAction = (delivery) => {
    switch (delivery.status) {
      case 'ASSIGNED':
        return {
          label: 'Mark as Picked Up',
          status: 'PICKED_UP',
          color: 'bg-indigo-500 hover:bg-indigo-600',
        };
      case 'PICKED_UP':
        return {
          label: 'Start Delivery',
          status: 'IN_TRANSIT',
          color: 'bg-purple-500 hover:bg-purple-600',
        };
      case 'IN_TRANSIT':
        return {
          label: 'Mark as Delivered',
          status: 'DELIVERED',
          color: 'bg-green-500 hover:bg-green-600',
        };
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Delivery Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'available', label: 'Available Orders', count: availableDeliveries.length },
          { key: 'my', label: 'My Deliveries', count: myDeliveries.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedDelivery(null); }}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Available Deliveries */}
          {activeTab === 'available' && (
            <div>
              {availableDeliveries.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="text-5xl mb-4">\ud83d\udce6</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Available</h3>
                  <p className="text-gray-500">New orders will appear here when restaurants mark them ready for pickup.</p>
                  <p className="text-gray-400 text-sm mt-2">Auto-refreshing every 15 seconds</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableDeliveries.map((delivery) => (
                    <div key={delivery.id} className="card border-l-4 border-l-orange-400 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-800">Order #{delivery.orderId}</h3>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              Awaiting Pickup
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">\ud83d\udccd</span>
                              <div>
                                <p className="text-xs text-gray-400 uppercase font-medium">Deliver to</p>
                                <p className="text-gray-700">{delivery.deliveryAddress || 'Address not provided'}</p>
                              </div>
                            </div>
                            {delivery.createdAt && (
                              <p className="text-xs text-gray-400 ml-6">
                                Created: {new Date(delivery.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptDelivery(delivery.id)}
                          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold shadow-sm"
                        >
                          Accept Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Deliveries */}
          {activeTab === 'my' && (
            <div>
              {myDeliveries.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="text-5xl mb-4">\ud83d\ude9a</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-500">Accept an available order to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDeliveries.map((delivery) => {
                    const action = getNextAction(delivery);
                    const isSelected = selectedDelivery === delivery.id;

                    return (
                      <div key={delivery.id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-800">Order #{delivery.orderId}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                {delivery.status?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            {delivery.agentName && (
                              <p className="text-sm text-gray-500 mt-1">Agent: {delivery.agentName}</p>
                            )}
                          </div>
                          {delivery.estimatedDeliveryTime && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">ETA</p>
                              <p className="font-semibold text-gray-700">
                                {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Address info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">\ud83d\udccd</span>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-medium">Delivery Address</p>
                              <p className="text-gray-700">{delivery.deliveryAddress || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Map toggle */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setSelectedDelivery(isSelected ? null : delivery.id)}
                            className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            {isSelected ? 'Hide Map' : 'Show Map'}
                          </button>
                          <button
                            onClick={() => openGoogleMaps(delivery.deliveryAddress || '')}
                            className="text-sm px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Open in Google Maps
                          </button>
                        </div>

                        {/* Embedded map */}
                        {isSelected && (
                          <div className="mb-4">
                            <DeliveryMap deliveryAddress={delivery.deliveryAddress} />
                          </div>
                        )}

                        {/* Action button */}
                        {action && (
                          <button
                            onClick={() => handleUpdateStatus(delivery.id, action.status)}
                            className={`w-full py-3 text-white rounded-lg font-semibold transition-colors ${action.color}`}
                          >
                            {action.label}
                          </button>
                        )}

                        {delivery.status === 'DELIVERED' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <p className="text-green-700 font-medium">\u2705 Delivery Completed</p>
                            {delivery.deliveryTime && (
                              <p className="text-green-600 text-sm mt-1">
                                Delivered at {new Date(delivery.deliveryTime).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryDashboard;
