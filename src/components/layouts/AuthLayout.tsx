import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-primary-200/30 to-blue-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-yellow-200/30 to-orange-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section - Updated to remove constraining box */}
          <div className="text-center mb-8 transform hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo.png" 
              alt="Tapee Cement" 
              className="h-28 w-auto mx-auto mb-6 drop-shadow-lg mix-blend-multiply"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 bg-clip-text text-transparent mb-3">
              Tapee Cement
            </h1>
            <p className="text-gray-700 text-xl font-medium">Loyalty Rewards Program</p>
            <div className="mt-3 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          {/* Auth Form Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
            {/* Card Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
            <Outlet />
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-10 text-center">
            <p className="text-gray-600 text-base mb-6 font-medium">Join thousands of satisfied customers</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">Earn Points</p>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">Secure</p>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
                <div className="w-10 h-10 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">Rewards</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm font-medium">
              © 2024 Tapee Cement. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}