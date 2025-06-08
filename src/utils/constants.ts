// Gujarat Districts
export const GUJARAT_DISTRICTS = [
  'Ahmedabad',
  'Amreli',
  'Anand',
  'Aravalli',
  'Banaskantha',
  'Bharuch',
  'Bhavnagar',
  'Botad',
  'Chhota Udaipur',
  'Dahod',
  'Dang',
  'Devbhoomi Dwarka',
  'Gandhinagar',
  'Gir Somnath',
  'Jamnagar',
  'Junagadh',
  'Kheda',
  'Kutch',
  'Mahisagar',
  'Mehsana',
  'Morbi',
  'Narmada',
  'Navsari',
  'Panchmahal',
  'Patan',
  'Porbandar',
  'Rajkot',
  'Sabarkantha',
  'Surat',
  'Surendranagar',
  'Tapi',
  'Vadodara',
  'Valsad'
];

// User Roles
export const USER_ROLES = [
  { value: 'builder', label: 'Builder' },
  { value: 'dealer', label: 'Dealer/Distributor' },
  { value: 'contractor', label: 'Contractor/Mason' }
];

// Point Value
export const POINTS_PER_BAG = 10;

// Sample Rewards
export const SAMPLE_REWARDS = [
  {
    id: '1',
    title: 'Cash Discount',
    description: 'Get ₹1000 discount on your next cement order',
    imageUrl: 'https://images.pexels.com/photos/259249/pexels-photo-259249.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    pointsRequired: 1000,
    available: true,
    expiryDate: '2025-12-31'
  },
  {
    id: '2',
    title: 'Goa Tour Package',
    description: 'Enjoy a 3-day tour of Goa with family (2 adults)',
    imageUrl: 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    pointsRequired: 5000,
    available: true,
    expiryDate: '2025-06-30'
  },
  {
    id: '3',
    title: 'Office Chair',
    description: 'Premium ergonomic office chair for your workspace',
    imageUrl: 'https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    pointsRequired: 1000,
    available: true,
    expiryDate: '2025-12-31'
  },
  {
    id: '4',
    title: 'Premium Toolbox',
    description: 'Professional-grade toolbox with essential construction tools',
    imageUrl: 'https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    pointsRequired: 800,
    available: true,
    expiryDate: '2025-08-15'
  }
];

// Navigation
export const USER_NAVIGATION = [
  { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Get Points', path: '/get-points', icon: 'PlusCircle' },
  { name: 'Redeem Rewards', path: '/redeem', icon: 'Gift' },
  { name: 'Transaction History', path: '/transactions', icon: 'History' },
  { name: 'Profile', path: '/profile', icon: 'User' }
];

export const DEALER_NAVIGATION = [
  { name: 'Dashboard', path: '/dealer/dashboard', icon: 'LayoutDashboard' },
  { name: 'Approve Points', path: '/dealer/approve-points', icon: 'CheckCircle' },
  { name: 'Rewards', path: '/dealer/rewards', icon: 'Gift' },
  { name: 'Transaction History', path: '/transactions', icon: 'History' },
  { name: 'Profile', path: '/profile', icon: 'User' }
];

export const ADMIN_NAVIGATION = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
  { name: 'Users', path: '/admin/users', icon: 'Users' },
  { name: 'Rewards', path: '/admin/rewards', icon: 'Gift' },
  { name: 'Approvals', path: '/admin/approvals', icon: 'CheckCircle' },
  { name: 'Marketing', path: '/admin/marketing', icon: 'Image' }
];

// Stats Cards
export const STATS_CARDS = {
  builder: [
    { title: 'Available Points', icon: 'Star', color: 'bg-primary-500', valueKey: 'points' },
    { title: 'Cement Bags Purchased', icon: 'Package', color: 'bg-secondary-500', valueKey: 'bagsPurchased' },
    { title: 'Rewards Redeemed', icon: 'Gift', color: 'bg-accent-500', valueKey: 'rewardsRedeemed' }
  ],
  dealer: [
    { title: 'Total Transactions', icon: 'Star', color: 'bg-primary-500', valueKey: 'totalTransactions' },
    { title: 'Pending Approvals', icon: 'Clock', color: 'bg-warning-500', valueKey: 'pendingApprovals' },
    { title: 'Approved Today', icon: 'CheckCircle', color: 'bg-success-500', valueKey: 'approvedToday' }
  ],
  contractor: [
    { title: 'Available Points', icon: 'Star', color: 'bg-primary-500', valueKey: 'points' },
    { title: 'Cement Bags Purchased', icon: 'Package', color: 'bg-secondary-500', valueKey: 'bagsPurchased' },
    { title: 'Rewards Redeemed', icon: 'Gift', color: 'bg-accent-500', valueKey: 'rewardsRedeemed' }
  ],
  admin: [
    { title: 'Total Users', icon: 'Users', color: 'bg-primary-500', valueKey: 'totalUsers' },
    { title: 'Pending Approvals', icon: 'Clock', color: 'bg-warning-500', valueKey: 'pendingApprovals' },
    { title: 'Total Rewards', icon: 'Award', color: 'bg-accent-500', valueKey: 'totalRewards' }
  ]
};