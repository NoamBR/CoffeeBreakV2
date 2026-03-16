export type User = {
  id: string;
  name: string;
  phone: string;
  birthday?: string; // DD/MM
  joinedAt: string;
  totalCoffees: number;
};

export type LoyaltyCard = {
  stamps: number;
  totalRewards: number;
  stampsGoal: number;
  history: StampEvent[];
};

export type StampEvent = {
  date: string;
  type: 'stamp' | 'reward_claimed';
};

export type MenuCategory = 'pastry' | 'sandwich' | 'salad' | 'breakfast' | 'specials' | 'hot_drinks' | 'drinks' | 'dessert' | 'snacks';

export type MenuItem = {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string | number;
  featured?: boolean;
  isNew?: boolean;
};

export type DealType = 'happy_hour' | 'birthday' | 'bring_friend' | 'seasonal' | 'general';

export type Deal = {
  id: string;
  title: string;
  description: string;
  image?: string;
  validUntil?: string;
  type: DealType;
};

export type StoreInfo = {
  name: string;
  nameHe: string;
  address: string;
  phone: string;
  instagram?: string;
  facebook?: string;
  latitude: number;
  longitude: number;
  hours: WeeklyHours;
};

// Cart & Order types
export type MilkType = 'regular' | 'oat' | 'almond' | 'soy' | 'coconut' | 'lactose_free';
export type SugarLevel = 'none' | 'half' | 'regular' | 'extra';
export type DrinkSize = 'small' | 'large';

export type FoodExtra = {
  id: string;
  name: string;
  price: number;
};

export type ItemCustomization = {
  milkType?: MilkType;
  sugarLevel?: SugarLevel;
  size?: DrinkSize;
  extras?: string[];
  notes?: string;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  image: string | number;
  price: number;
  quantity: number;
  customization?: ItemCustomization;
  totalPrice: number;
};

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type FullOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  items: { itemId: string; itemName: string; price: number; quantity: number; customizations?: string }[];
  total: number;
  discount: number;
  pickupTime: string;
  notes?: string;
  date: string; // ISO - when order was placed
  statusUpdatedAt: string; // ISO - last status change
  readyAt?: string; // ISO - when marked ready
  completedAt?: string; // ISO - when completed
  status: OrderStatus;
};

// Voucher system
export type VoucherType = 'free_coffee' | 'discount_percent' | 'free_pastry' | 'free_upgrade' | 'birthday_gift';
export type VoucherStatus = 'active' | 'pending' | 'redeemed' | 'expired' | 'cancelled';

export type Voucher = {
  id: string;
  type: VoucherType;
  status: VoucherStatus;
  title: string;
  description: string;
  value?: number;
  barcode: string;
  source?: string;
  earnedAt: string;
  redeemedAt?: string;
  expiresAt?: string;
  redeemedBy?: string;
};

export type DayHours = {
  open: string; // "07:00"
  close: string; // "22:00"
  closed?: boolean;
};

export type WeeklyHours = {
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
};
