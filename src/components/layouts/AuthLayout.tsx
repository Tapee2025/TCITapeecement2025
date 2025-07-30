import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Building Skyline Background */}
        <div className="absolute top-0 left-0 w-full h-32 opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 800 200" className="text-primary-300">
            <rect x="50" y="80" width="40" height="120" fill="currentColor" />
            <rect x="100" y="60" width="60" height="140" fill="currentColor" />
            <rect x="170" y="90" width="35" height="110" fill="currentColor" />
            <rect x="220" y="50" width="50" height="150" fill="currentColor" />
            <rect x="280" y="70" width="45" height="130" fill="currentColor" />
            <rect x="340" y="40" width="55" height="160" fill="currentColor" />
            <rect x="410" y="85" width="40" height="115" fill="currentColor" />
            <rect x="460" y="65" width="50" height="135" fill="currentColor" />
            <rect x="520" y="75" width="45" height="125" fill="currentColor" />
            <rect x="580" y="55" width="60" height="145" fill="currentColor" />
            <rect x="650" y="90" width="35" height="110" fill="currentColor" />
            <rect x="700" y="70" width="50" height="130" fill="currentColor" />
          </svg>
        </div>
            <rect x="45" y="40" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="52" y="40" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="38" y="50" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="45" y="50" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="52" y="50" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="68" y="70" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="73" y="70" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="78" y="70" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="91" y="50" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="98" y="50" width="4" height="5" fill="white" opacity="0.6" />
            <rect x="105" y="50" width="4" height="5" fill="white" opacity="0.6" />
          </svg>
        </div>
        
        <div className="absolute top-20 right-10 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}>
          <svg width="140" height="120" viewBox="0 0 140 120" className="text-accent-400">
            <rect x="5" y="40" width="30" height="80" fill="currentColor" />
            <rect x="40" y="25" width="35" height="95" fill="currentColor" />
            <rect x="80" y="45" width="25" height="75" fill="currentColor" />
            <rect x="110" y="30" width="25" height="90" fill="currentColor" />
            {/* Construction crane */}
            <line x1="115" y1="30" x2="115" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="115" y1="5" x2="145" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="145" y1="5" x2="140" y2="20" stroke="currentColor" strokeWidth="2" />
            <rect x="138" y="18" width="4" height="6" fill="currentColor" />
            {/* Windows */}
            <rect x="8" y="50" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="15" y="50" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="22" y="50" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="29" y="50" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="8" y="60" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="15" y="60" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="22" y="60" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="29" y="60" width="4" height="5" fill="white" opacity="0.7" />
            <rect x="45" y="35" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="53" y="35" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="61" y="35" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="69" y="35" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="45" y="45" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="53" y="45" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="61" y="45" width="5" height="6" fill="white" opacity="0.7" />
            <rect x="69" y="45" width="5" height="6" fill="white" opacity="0.7" />
          </svg>
        </div>
        
        <div className="absolute bottom-10 left-5 opacity-12 animate-pulse" style={{ animationDelay: '2s' }}>
          <svg width="100" height="90" viewBox="0 0 100 90" className="text-secondary-400">
            <rect x="15" y="30" width="15" height="60" fill="currentColor" />
            <rect x="35" y="15" width="20" height="75" fill="currentColor" />
            <rect x="60" y="35" width="12" height="55" fill="currentColor" />
            <rect x="77" y="25" width="18" height="65" fill="currentColor" />
            {/* Cement mixer truck */}
            <ellipse cx="25" cy="85" rx="8" ry="3" fill="currentColor" opacity="0.6" />
            <rect x="20" y="82" width="10" height="3" fill="currentColor" />
            <circle cx="22" cy="85" r="2" fill="white" opacity="0.8" />
            <circle cx="28" cy="85" r="2" fill="white" opacity="0.8" />
            {/* Building windows */}
            <rect x="18" y="40" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="22" y="40" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="26" y="40" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="38" y="25" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="44" y="25" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="50" y="25" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="38" y="35" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="44" y="35" width="3" height="4" fill="white" opacity="0.6" />
            <rect x="50" y="35" width="3" height="4" fill="white" opacity="0.6" />
          </svg>
        </div>
        
        <div className="absolute bottom-20 right-20 opacity-10 animate-pulse" style={{ animationDelay: '3s' }}>
          <svg width="80" height="100" viewBox="0 0 80 100" className="text-purple-400">
            <rect x="10" y="40" width="12" height="60" fill="currentColor" />
            <rect x="25" y="25" width="18" height="75" fill="currentColor" />
            <rect x="48" y="50" width="14" height="50" fill="currentColor" />
            <rect x="65" y="35" width="10" height="65" fill="currentColor" />
            {/* Factory chimney with smoke */}
            <rect x="30" y="10" width="4" height="15" fill="currentColor" />
            <ellipse cx="32" cy="8" rx="3" ry="2" fill="currentColor" opacity="0.4" />
            <ellipse cx="34" cy="5" rx="2" ry="1.5" fill="currentColor" opacity="0.3" />
            <ellipse cx="36" cy="3" rx="1.5" ry="1" fill="currentColor" opacity="0.2" />
            {/* Windows */}
            <rect x="28" y="35" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="32" y="35" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="36" y="35" width="2" height="3" fill="white" opacity="0.6" />
            <rect x="40" y="35" width="2" height="3" fill="white" opacity="0.6" />
          </svg>
        </div>
        
        {/* Floating cement particles */}
        <div className="absolute top-1/3 left-1/4 opacity-20">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <div className="absolute top-1/2 right-1/3 opacity-15">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }}></div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 opacity-25">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '2.1s' }}></div>
        </div>
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
              className="h-28 w-auto mx-auto mb-6 drop-shadow-lg"
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