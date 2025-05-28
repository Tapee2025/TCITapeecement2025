import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand and info */}
      <div className="bg-primary-600 text-white w-full md:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <Building2 className="h-10 w-10 mr-2" />
            <h1 className="text-3xl font-bold">Tapee Cement</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Loyalty Rewards Program</h2>
          <p className="text-primary-100 text-lg mb-6">
            Join our loyalty program and earn rewards for every cement bag purchase. Redeem points for exciting rewards and benefits.
          </p>
          <div className="bg-primary-700/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="font-medium text-xl mb-3">Program Benefits</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="bg-primary-400 rounded-full p-1 mr-2 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </span>
                <span>Earn 10 points for every cement bag purchased</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-400 rounded-full p-1 mr-2 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </span>
                <span>Redeem points for cash discounts, tours, and merchandise</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-400 rounded-full p-1 mr-2 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </span>
                <span>Special rewards for loyal customers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="w-full md:w-1/2 bg-white p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}