/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Order, Transaction, DailyMetric } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Minimalist Trench Coat',
    price: 1240.00,
    stock: 42,
    category: 'Ready-to-wear • Seasonal',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADh9oOmtPkwjJFn2GzQVAyrCy-awTDiEj1tT0YGUiorZvl7lFQHO_M6RUmcVjd9jY6USLT-l9s4OS1u8op-69nyNRr7Nx5WXxMnb5Kn1UPO3WUbe3KIDpwqjxkQsiwAV3EtoDUFPO8xxEJYJn93KSET0JMCfdokoKxkBbGQGvOr4s_FBVOQJ8Sczx_6GrnpPIFs3racx3Aqxbivq_7LuqSZvXeDIrkVPlwBCYl_wwaQDJfaqR3ygIvZVziCTWncTrGl-RTcC3hiEir',
  },
  {
    id: '2',
    name: 'Silk Evening Blouse',
    price: 450.00,
    stock: 3,
    category: 'Silk Atelier • Eveningwear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm2VjC2TXYwTdypXGfdSWAF1TWL20-YVDFcs-dA1Yl7jaQJvtTYsbFvvYKTo0tDyH3MGrweWsB46DOaAY81CCKPnpplYhvDKQRV2NkvlUFRwURiAUtOcQric9YQo2JanRLJJ_9BjobkiRirXq1_KlQY4UGIZ0XU4lKUTYHpcUHO6R-ve434nUhFiKL-uE4kfijs08-fKgQydOLe7sG5VxmtcMJ-9_waap4pnP054ZjuMbKZjztjNG_X037rkZvjAT6TFTbmUBTyXdr',
  },
  {
    id: '3',
    name: 'Architectural Heel',
    price: 890.00,
    stock: 18,
    category: 'Footwear • Sculptural',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8-zeiLT-KwStC73TmIOBsBuyi0A5DSrfhdkXOawk_SKAYj0Bz-LpCI8Zwyia8qabsJaRS8KJm7IU6nqZl9Y9Y8dWKXd8uJcU_bGh1iDKPBEP1pXXqpwgUSs4HPMW5MC1HevQOA1T1DoxBrb-2ilwRLb9ZszFrxBpxRPWSHzYCahy9MToq6jpXVKlA52fPlMEeU7_JFXIoA4enTEqR_4_kkTBg1LsrvYzsukvkO9Y1i9AadJId4iaPKSNtAnjLrZOGhwWWbBX32l6z',
  },
  {
    id: '4',
    name: 'Cashmere Scarf',
    price: 320.00,
    stock: 104,
    category: 'Accessories • Winter',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaTZmE0tYlYxF0_lutM2X2Lcjd5pBmwlpzeu4gLmiUJr9kFk-7HqTSTnFuMo7PfPkSeH-IVSwqzZxGpkhEj9-dzYoASIKPdC85fWYf2VqPo1gNkr2iyK-Gaqeuj_WWmniWvKh2Z239NsiMV9YhFjRgvJBQdkPh0QlqVG2BIhE2NaqyQQbW9B2sg-mY75hbJWpUX5gn6i9EIXTqlHNSrm6Npu0ik9Gj-jbuazeFNT1JB1HMndqqY9CVjXUnxmciE9mO5l8yXJKDDSRz',
  },
  {
    id: '5',
    name: 'Organic Cotton Set',
    price: 89.00,
    stock: 55,
    category: 'Artisanal • Sustainable',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXL7IHZR2g0_Wiq9VqwdMVBESDQpVvpv2oKOjezRGT_vlsxwQaRtom3hoovbezAaFnKY1meHA_XaCG9QCx9J3TgJ8b_zsJd8pClzIcdIiN-lAR7804WE2AFN23O3Yw0Phcyl9N7V1B1bO6gwoeRAZn-2Me3QAg924KKAWSq23Rp-RucG3JcIgEAcW3n12yTstD3FCPDkqTzbMG14y6elq-yFhghpBIfM4AEP1b_ULrZT1yy2pQbSb_EvAf5KZum7A5_vg-5xEidPG8',
  },
  {
    id: '6',
    name: 'Hand-Carved Brooch',
    price: 45.50,
    stock: 12,
    category: 'Accessories • Handcrafted',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3QKVn42OK_NRYVxBPXswLC4832tUR3jP28UIPLjvnxfX4jIbRpSMzyc8kkAq8WfDkma8iXYQQ_UJkJmcDjXznF1SQ-AkoeENzTcKb_-plfkc29Ukia4kEVLr3Y2O7BmI39axbXoXZFeOZnJSw2APpjA4W45uRWu7q4wXRcFuCCzj27LCL8WzM5HkbGhg8Mr6Y47KuLr9Pu8YRT6YIN1nvnu7ZCEiaHTViyYAm1S7Y_wsmzwhnQNPhbr0xy73Lq_ZvL-XYbrXx9aHB',
  }
];

export const ORDERS: Order[] = [
  {
    id: '#AT-849203',
    productId: '1',
    productName: 'Minimalist Trench Coat',
    productImage: PRODUCTS[0].image,
    status: 'SHIPPED',
    customer: 'Elena Richardson',
    amount: 210.00,
    date: 'Oct 24, 2023',
  },
  {
    id: '#AT-849204',
    productId: '5',
    productName: 'Organic Cotton Set',
    productImage: PRODUCTS[4].image,
    status: 'PROCESSING',
    customer: 'Julian Vance',
    amount: 89.00,
    date: 'Oct 24, 2023',
  },
  {
    id: '#AT-849205',
    productId: '6',
    productName: 'Hand-Carved Brooch',
    productImage: PRODUCTS[5].image,
    status: 'SHIPPED',
    customer: 'Sarah Jenkins',
    amount: 45.50,
    date: 'Oct 23, 2023',
  }
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    productName: 'Bespoke Silk Gown',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFnhBLkxOlI1QzZZEOTcjLgLXlFWuDpEes3aLDsrObPM9hGi5ldlZgaDCOwuG32qbyBimt3u_lzYt2lBNNDWUHHwBrkBJ_0xgyUxwp3JMhSE5aZcTeQp9i7FNTs_3OU8xu8dq2iWL0exj1gnXweSNZqzyiJfLfl9kiPYYeXqunNmvuBrvZ3zZEkYVVto-kO6BrZGetAYhP-_LjHY_34lYOOSFpwUr5EVTIKvepBBk4pxqcQ-G2RRr3gXp8JfC0VvQq1tTbzx0w-LL7',
    customer: 'Elena Rossi',
    amount: 2450.00,
    status: 'PAID',
    date: 'Oct 24, 2023',
  },
  {
    id: '2',
    productName: 'Italian Leather Tote',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChSDzjSKzmbpY43EDPIxgJmQSOViSxYH5-VN24fvkYBtIpG0CmY1IzYi1SEnWZ1aLGs7SYmoGoux8qNjYTIOW5xyY6z5AZHwNA3vCcM2e0BNRa2W1Ev9IyecbLRgBMXXAiyz2awP1zY44z-c6LMMhNlDCqjH6GCgvZBhgphWKX9HI6Ms6_4skJaRSaDtW8nLsRde0cs7U5GlH3oU0m3yaYnLxVrnEFxbRlp7eUxT36jhBDhYRdvb3Y99U-W86HxEGLXsDdw4M81QnO',
    customer: 'Marcus Webb',
    amount: 890.00,
    status: 'PAID',
    date: 'Oct 24, 2023',
  },
  {
    id: '3',
    productName: 'Handcrafted Vase',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7miPfewFYQ8l8t9Qk7OyRXmML0zU2JZXH01P9pOaCQdSkzxixaI9pDnrdFkFYIcEfHNjFrcSmN488fZnCNhWv0jdrzDmTZanOzgyLiGL39z5AZtPdETkGdxwRcnhACY1q4dYac7JSOgygUJpJzmLNiFr-qG1n9SLyNOrX85w8XcJWWdml7MW3GWC8hjUCdcwc4HfFdd-1qU7KscTtnF1CC7azQU277HOpCHBuWIZTia8MyGFXef94k7EP1-7g7i6OE9t1pm_BbEt3',
    customer: 'Anonymous',
    amount: 120.00,
    status: 'PAID',
    date: 'Oct 23, 2023',
  },
  {
    id: '4',
    productName: 'Bespoke Silk Gown',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiFcYxMHlQ1BGIbaxbDXa4PfPzrBDogUUeOlw16x6Wfr9BG7I2FJ5BzuQvMtNhDcqaLeTr4aVtZ8h8doyQJCYZZ8mduMGjKh0gXZJseTTcbWkIoMwQyGq30A1yFU2HFKqHY1o_LIhyA6tDcHgfYo4Xsf0-HtKN2uVncjIHqZy9g0nWzThsbemn16z3kXVldChzwvbRs6BdjSDGlMZTY2jYfLJIFrF57qy__SXCYrNbiW-0CJQv1g6l40wza2zj42rbeCxqx1SftePM',
    customer: 'Sarah Jenkins',
    amount: 2450.00,
    status: 'REFUNDED',
    date: 'Oct 23, 2023',
  },
  {
    id: '5',
    productName: 'Ceramic Dinner Set',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqIv11nNIQVQLAkB5OMnCdoWoblyHbfikHiqn6yu8GqVadkdWsT4DrtuXSpEW4qS3v7CKuyB-7Wzow8RQAleGKArKwjpmO6OR0udjYb2_NDKkS1tHlUwBSChvYRNpjc5POqbQwDZrk7X2X0Hts3_LbrsvMASGl9Bm7AHlPPJI-vkj22LTutKAcr9aMxZTsY1U-2KIdO4uE27jcqace-cYNxCggctS1NLrlzDWkzD-zfA3lFIaWX5DAZixtGHLez_GuM6VAnciuGqAm',
    customer: 'David Chen',
    amount: 420.00,
    status: 'PAID',
    date: 'Oct 23, 2023',
  }
];

export const CHART_DATA: DailyMetric[] = [
  { day: 'MON', revenue: 40 },
  { day: 'TUE', revenue: 60 },
  { day: 'WED', revenue: 55 },
  { day: 'THU', revenue: 85 },
  { day: 'FRI', revenue: 95 },
  { day: 'SAT', revenue: 45 },
  { day: 'SUN', revenue: 30 },
];
