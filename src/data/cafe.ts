export const cafe = {
  name: "Aromica Café",
  tagline: "Coffee • Chai • Comfort",
  slogan: "Good Food, Good Mood",
  neighborhood: "Near Boral High School",
  city: "Kolkata",
  address: {
    street: "Rajnarayan Park, C/9, Boral Main Road, near Boral High School",
    locality: "Usha Pally, Kamdahari",
    cityRegion: "Kolkata, Rajpur Sonarpur",
    statePostal: "West Bengal 700154",
    full: "AROMICA CAFE, Rajnarayan park, C/9, Boral Main Road, near Boral high school, Usha Pally, Kamdahari, Kolkata, Rajpur Sonarpur, West Bengal 700154",
  },
  landmarks: ["Near Boral High School", "Rajnarayan Park, C/9", "Boral Main Road"],
  phone: {
    display: "+91 91236 07395",
    raw: "9123607395",
    href: "tel:+919123607395",
  },
  whatsapp: {
    display: "+91 91236 07395",
    raw: "9123607395",
    href: "https://wa.me/919123607395?text=Hi%20Aromica%20Caf%C3%A9!",
  },
  instagram: {
    handle: "@aromica_cafe_",
    href: "https://www.instagram.com/aromica_cafe_/",
  },
  orderOnline: {
    label: "Order Online",
    href: "https://order.khide.in/191242969",
  },
  menuFlipbook: {
    href: "https://go.fliplink.me/view/89104736-B13B-4B7A-936A-A6440716531F",
  },
  directions: {
    href: "https://www.google.com/maps/dir//AROMICA+CAFE,+Rajnarayan+park,+C%2F9,+Boral+Main+Road,+near+Boral+high+school,+Usha+Pally,+Kamdahari,+Kolkata,+Rajpur+Sonarpur,+West+Bengal+700154/@22.4724502,88.3706634,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a027117fdf49f9d:0x8c5e094bd0449ba!2m2!1d88.3758395!2d22.4543465?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D",
    embedSrc: "https://maps.google.com/maps?q=22.4543465,88.3758395&z=16&output=embed",
  },
  coordinates: {
    lat: 22.4543465,
    lng: 88.3758395,
  },
} as const;

export const OPEN_MINUTES = 17 * 60; // 5:00 PM
export const CLOSE_MINUTES = 22 * 60 + 30; // 10:30 PM
export const CLOSED_DAY_INDEX = 1; // Monday (0 = Sun, 1 = Mon)

export interface DayHours {
  day: string;
  hours: string;
  isClosed: boolean;
  dayIndex: number; // 0=Sunday, 1=Monday, etc.
}

export const weeklySchedule: DayHours[] = [
  { day: "Monday", hours: "Closed", isClosed: true, dayIndex: 1 },
  { day: "Tuesday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 2 },
  { day: "Wednesday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 3 },
  { day: "Thursday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 4 },
  { day: "Friday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 5 },
  { day: "Saturday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 6 },
  { day: "Sunday", hours: "5:00 PM – 10:30 PM", isClosed: false, dayIndex: 0 },
];

export interface MenuItem {
  name: string;
  price: string;
  veg: boolean;
  description?: string;
  note?: string;
}

export interface MenuGroup {
  title: string;
  note?: string;
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  label: string;
  groups: MenuGroup[];
}

const v = (name: string, price: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  name,
  price,
  veg: true,
  ...extra,
});

const nv = (name: string, price: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  name,
  price,
  veg: false,
  ...extra,
});

export const menuCategories: MenuCategory[] = [
  {
    id: "beverages",
    label: "Coffee & Beverages",
    groups: [
      {
        title: "Hot Coffee",
        items: [
          v("Black Coffee", "35"),
          v("Milk Coffee", "35 / 55"),
          v("Hazelnut Hot Coffee", "89"),
          v("Chocolate Hot Coffee", "89"),
          v("Espresso", "99"),
          v("Cappuccino", "89"),
        ],
      },
      {
        title: "Cold Coffee & Shakes",
        note: "Add a scoop of ice cream for ₹29",
        items: [
          v("Classic Cold Coffee", "109"),
          v("Chocolate Cold Coffee", "119"),
          v("Iced Latte", "109"),
          v("Iced Americano", "89"),
          v("Hazelnut Milkshake", "129"),
          v("Chocolate Shake", "119"),
          v("KitKat Shake", "119"),
          v("Caramel Milkshake", "119"),
          v("Oreo Shake", "139"),
        ],
      },
      {
        title: "Chai (Tea) Varieties",
        items: [
          v("Masala Chai", "20"),
          v("Ginger Chai", "20"),
          v("Kesar Chai", "50"),
          v("Kullad Chai", "35"),
          v("Black Tea", "20"),
          v("Green Tea", "40"),
          v("Irani Chai", "49"),
          v("Herbal Chai", "49"),
          v("Lemon Tea", "25"),
        ],
      },
      {
        title: "Lassi Special",
        items: [
          v("Plain Lassi", "59"),
          v("Salted Lassi", "59"),
          v("Rose Lassi", "69"),
          v("Mango Lassi", "99"),
          v("Kesar Lassi", "99"),
          v("Dry Fruit Lassi", "109"),
        ],
      },
      {
        title: "Summer Special Mocktails",
        items: [
          v("Galaxy Mocktail", "119", {
            description: "Blue curaçao, lime, lemonade & sparkle",
          }),
          v("Virgin Mojito", "69", { description: "Lime, mint, soda" }),
          v("Mango Mojito", "79", { description: "Mango, lime, mint, soda" }),
          v("Strawberry Mojito", "79", { description: "Strawberry, lime, mint, soda" }),
          v("Blue Lagoon", "79", { description: "Blue curaçao, lime, soda" }),
          v("Watermelon Cooler", "79", { description: "Watermelon, lime, mint" }),
          v("Orange Smash", "79", { description: "Orange, lime, soda" }),
          v("Masala Soda", "59", { description: "Jeera, black salt, mint, lime, soda" }),
        ],
      },
    ],
  },
  {
    id: "momos",
    label: "Momos",
    groups: [
      {
        title: "Momos (6 pcs)",
        items: [
          v("Veg Momo", "79"),
          nv("Chicken Momo", "99"),
          nv("Chicken Fried Momo", "119"),
          nv("Chicken Cheese Momo", "149"),
          nv("Chicken Pan Fried Momo", "149"),
          nv("Gandharaj Momo", "129", { description: "Kolkata fragrant gondhoraj lime twist" }),
        ],
      },
    ],
  },
  {
    id: "burgers",
    label: "Burgers & Sandwiches",
    groups: [
      {
        title: "Burgers",
        items: [
          v("Aloo Tikki Burger", "79"),
          v("Aloo Tikki Cheese Burger", "89"),
          nv("Chicken Burger", "99"),
          nv("Chicken Cheese Burger", "109"),
        ],
      },
      {
        title: "Sandwiches",
        items: [
          v("Veg Sandwich", "89"),
          v("Paneer Tikka Sandwich", "109"),
          nv("Chicken Sandwich", "119"),
          nv("Chicken Cheese Sandwich", "129"),
        ],
      },
    ],
  },
  {
    id: "pizza",
    label: '8" Pizzas',
    groups: [
      {
        title: "Pizza Menu (8 inch)",
        items: [
          v("Classic Margherita Pizza", "179", { description: "Classic delight with 100% real mozzarella cheese" }),
          v("Farmhouse Pizza", "219", { description: "Loaded with veggies & cheese" }),
          v("Paneer Tikka Pizza", "229", { description: "Paneer tikka with cheesy goodness" }),
          nv("Peri Peri Chicken Pizza", "249", { description: "Spicy peri peri chicken with veggies" }),
          nv("Chicken Tikka Pizza", "259", { description: "Chicken tikka & cheese perfection" }),
          nv("Hawaiian Chicken Pizza", "269", { description: "Chicken, pineapple & cheese" }),
          nv("Chicken Supreme Pizza", "279", { description: "Loaded toppings" }),
        ],
      },
      {
        title: "Pizza Add-ons",
        items: [
          v("Extra Cheese", "30"),
          v("Extra Paneer", "40"),
          nv("Extra Chicken", "50"),
        ],
      },
    ],
  },
  {
    id: "starters",
    label: "Starters & Specials",
    groups: [
      {
        title: "Non-Veg Specials",
        items: [
          nv("Chicken Pakora", "120"),
          nv("Chicken 65", "129"),
          nv("Fish Fry (2 pcs)", "129", { description: "Kolkata evening classic" }),
          nv("Fish Fingers (6 pcs)", "159"),
          nv("Fish Ball (6 pcs)", "129"),
          nv("Chicken Cheese Ball (6 pcs)", "149"),
        ],
      },
      {
        title: "Sides",
        items: [
          v("French Fries", "99"),
          v("Peri Peri French Fries", "149"),
          nv("Chicken Nuggets", "149"),
          nv("Chicken Ball / Popcorn", "119"),
          v("Masala Corn", "59"),
        ],
      },
      {
        title: "Pasta",
        items: [
          v("Red Sauce Pasta", "119"),
          v("White Sauce Pasta", "149"),
          v("Mix Sauce Pasta", "159"),
          v("Cheesy Pasta", "159"),
          nv("Pesto Chicken Pasta", "249"),
        ],
      },
    ],
  },
  {
    id: "combos",
    label: "Combos",
    groups: [
      {
        title: "Value Combos",
        items: [
          nv("Combo 1", "199", {
            description: "Chicken Burger + French Fries + Soft Drink (glass) + Ice Cream (1 scoop)",
          }),
          nv("Combo 2", "179", {
            description: "Chicken Momos (6 pcs) + French Fries + Soft Drink (glass)",
          }),
          nv("Combo 3", "249", {
            description: "Pasta (any) + Chicken Cheese Ball (4 pcs) + Soft Drink (glass)",
          }),
        ],
      },
      {
        title: "Add-ons",
        items: [
          v("Extra Cheese", "20"),
          v("Extra Paneer", "25"),
          nv("Extra Chicken", "30"),
        ],
      },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    groups: [
      {
        title: "Ice Cream & Desserts",
        items: [
          v("Ice Cream (2 scoops)", "69", {
            description: "Chocochip, Butterscotch, Fruit & Nut, Mango or Kesar Pista",
          }),
          v("Gulab Jamun (2 pcs)", "79"),
          v("Chocolate Brownie with Ice Cream", "159"),
        ],
      },
    ],
  },
];

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category?: string;
  tall?: boolean;
  aspectClass?: string;
}

export const galleryItems: GalleryItem[] = [
  {
    id: "crispy-snack",
    src: "/images/aromica-crispy-snack-01.webp",
    alt: "Golden crispy cutlets served with mustard dip alongside cups of hot tea",
    caption: "Crispy Snacks & Hot Tea",
    category: "Food",
    aspectClass: "aspect-square",
  },
  {
    id: "cold-coffee",
    src: "/images/aromica-cold-coffee-01.webp",
    alt: "Tall glass of blended cold coffee garnished with cocoa powder",
    caption: "Cold Coffee",
    category: "Beverages",
    tall: true,
    aspectClass: "aspect-[3/4]",
  },
  {
    id: "momos-snacks",
    src: "/images/aromica-momos-snacks-01.webp",
    alt: "Steamed momos with spicy chutney and crispy snack fingers with mustard dip",
    caption: "Momos & Crispy Snacks",
    category: "Food",
    aspectClass: "aspect-[4/3]",
  },
  {
    id: "kullad-coffee",
    src: "/images/aromica-coffee-01.webp",
    alt: "Hot beverage served in an earthen clay kullad cup with an orange saucer",
    caption: "Coffee in Kullad Cup",
    category: "Beverages",
    aspectClass: "aspect-square",
  },
  {
    id: "flowers-table",
    src: "/images/aromica-flowers-table-01.webp",
    alt: "Colorful fresh flowers in a glass vase on a checkered café table",
    caption: "Café Table Detail",
    category: "Atmosphere",
    tall: true,
    aspectClass: "aspect-[3/4]",
  },
  {
    id: "burger-platter",
    src: "/images/aromica-burger-platter-01.webp",
    alt: "Burger platter served with shredded salad and momos on a café table",
    caption: "Burger Platter",
    category: "Food",
    aspectClass: "aspect-[16/9]",
  },
  {
    id: "hot-tea",
    src: "/images/aromica-tea-01.webp",
    alt: "Hot tea served in a patterned ceramic mug on a white saucer",
    caption: "Tea at Aromica",
    category: "Chai",
    aspectClass: "aspect-square",
  },
  {
    id: "storefront-day",
    src: "/images/aromica-exterior-day-01.webp",
    alt: "Daytime storefront facade with Aromica Pure Essence signage and glass entrance",
    caption: "Storefront by Day",
    category: "Exterior",
    aspectClass: "aspect-[16/10]",
  },
  {
    id: "storefront-night",
    src: "/images/aromica-exterior-night-01.webp",
    alt: "AROMICA Café storefront at night with illuminated signage on Boral Main Road",
    caption: "Aromica Café at Night",
    category: "Exterior",
    aspectClass: "aspect-[4/3]",
  },
];

// Reserved reviews architecture for when verified reviews are provided
export interface ReviewItem {
  id: string;
  author: string;
  text: string;
  date?: string;
}

export const verifiedReviews: ReviewItem[] = [];
