import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl p-12 md:p-20 text-center mb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900 leading-tight">
            Delicious Food,<br />
            <span className="text-primary">Delivered Fast</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Order from your favorite restaurants and get food delivered to your doorstep in minutes.
          </p>
          <Link
            to="/restaurants"
            className="inline-block bg-primary text-white text-lg px-10 py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            Browse Restaurants
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: '\ud83c\udf54', title: 'Wide Selection', desc: 'Choose from hundreds of restaurants and thousands of dishes.' },
          { icon: '\u26a1', title: 'Fast Delivery', desc: 'Get your food delivered hot and fresh in under 45 minutes.' },
          { icon: '\ud83d\udd12', title: 'Secure Payment', desc: 'Pay securely with credit card, debit card, or digital wallet.' },
        ].map((f) => (
          <div key={f.title} className="card text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', label: 'Choose Restaurant', icon: '\ud83c\udfea' },
            { step: '2', label: 'Add to Cart', icon: '\ud83d\uded2' },
            { step: '3', label: 'Pay Securely', icon: '\ud83d\udcb3' },
            { step: '4', label: 'Track & Enjoy', icon: '\ud83d\ude0b' },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl mb-3">
                {s.icon}
              </div>
              <span className="text-sm font-bold text-primary mb-1">Step {s.step}</span>
              <span className="text-gray-600 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
