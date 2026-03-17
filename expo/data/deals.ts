import { Deal } from '@/types';

export const deals: Deal[] = [
  {
    id: 'deal-1',
    title: 'הקפה החמישי עלינו!',
    description: 'אספו 5 חותמות וקבלו משקה חינם לבחירתכם. תקף לכל סוגי המשקאות.',
    type: 'general',
    image: require('../assets/social/promo-coffee-and-3.png'),
  },
  {
    id: 'deal-2',
    title: 'Happy Hour! 15:00-17:00',
    description: '20% הנחה על כל המשקאות הקרים בין השעות 15:00-17:00 בימים א\'-ה\'.',
    type: 'happy_hour',
    image: require('../assets/social/promo-drinks-lineup.png'),
  },
  {
    id: 'deal-3',
    title: 'יום הולדת? מגיע לך!',
    description: 'בחודש יום ההולדת שלך - קבלו משקה + מאפה במתנה. פשוט הראו את האפליקציה.',
    type: 'birthday',
    image: require('../assets/social/promo-dessert-party.png'),
  },
  {
    id: 'deal-4',
    title: 'הביאו חבר - קבלו חותמת!',
    description: 'הביאו חבר שעוד לא הכיר אותנו וקבלו חותמת בונוס בכרטיס הנאמנות.',
    type: 'bring_friend',
    image: require('../assets/social/promo-couple-sharing.png'),
  },
  {
    id: 'deal-5',
    title: 'ספיישל החורף',
    description: 'שוקו חם בלגי עם מרשמלו וקינמון - רק ₪18 במקום ₪22. לזמן מוגבל!',
    type: 'seasonal',
    validUntil: '2026-04-01',
    image: require('../assets/social/promo-morning-ritual.png'),
  },
];
