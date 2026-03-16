import { Tabs, useRouter } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Home, Coffee, Gift, Tag, User, ShoppingCart } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import CartBadge from '@/components/CartBadge';
import { useCartStore } from '@/stores/cartStore';

export default function TabLayout() {
  const colors = useThemeColors();
  const router = useRouter();
  const getItemCount = useCartStore((s) => s.getItemCount);
  const cartCount = getItemCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'תפריט',
          headerTitle: 'התפריט שלנו',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Coffee size={size} color={color} />
              <CartBadge count={cartCount} />
            </View>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/cart')}
              style={{ marginRight: 16 }}
              hitSlop={8}
            >
              <View>
                <ShoppingCart size={22} color={colors.white} />
                <CartBadge count={cartCount} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'נאמנות',
          headerTitle: 'כרטיס נאמנות',
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'מבצעים',
          headerTitle: 'מבצעים והטבות',
          tabBarIcon: ({ color, size }) => <Tag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
