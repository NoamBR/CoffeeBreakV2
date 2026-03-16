import { StoreInfo } from '@/types';

const storeInfo: StoreInfo = {
  name: 'CoffeeBreak',
  nameHe: 'הפסקת קפה',
  address: 'טיילת הצפונית, אשקלון',
  phone: '08-1234567',
  instagram: 'coffeebreak_ashkelon',
  facebook: 'coffeebrakeashkelon',
  latitude: 31.6790,
  longitude: 34.5580,
  hours: {
    sunday: { open: '07:00', close: '22:00' },
    monday: { open: '07:00', close: '22:00' },
    tuesday: { open: '07:00', close: '22:00' },
    wednesday: { open: '07:00', close: '22:00' },
    thursday: { open: '07:00', close: '22:00' },
    friday: { open: '07:00', close: '15:00' },
    saturday: { open: '00:00', close: '00:00', closed: true },
  },
};

export const brandStory = {
  headline: 'הסיפור שלנו',
  text: 'הפסקת קפה נולדה מתוך אהבה אמיתית לקפה, למאפים טריים ולקהילה שלנו באשקלון. אנחנו מאמינים שכל הפסקה ראויה לרגע של איכות — קפה שנטחן ברגע, מאפה שנאפה הבוקר, ושירות עם חיוך. אצלנו כל פריט מוכן בעבודת יד, מחומרי גלם איכותיים, בלי קיצורי דרך.',
  values: [
    {
      icon: 'heart' as const,
      title: 'עבודת יד, כל יום מחדש',
      description: 'כל מאפה נאפה טרי כל בוקר, בעבודת יד ובאהבה',
    },
    {
      icon: 'leaf' as const,
      title: 'חומרי גלם איכותיים',
      description: 'אנחנו בוחרים רק את החומרים הטובים ביותר — בלי פשרות',
    },
    {
      icon: 'users' as const,
      title: 'קהילה לפני הכל',
      description: 'הלקוחות שלנו הם המשפחה שלנו. כל ביקור הוא מפגש בין חברים',
    },
  ],
};

export default storeInfo;
