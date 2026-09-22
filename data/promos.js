// The three promotions specified in the redesign brief. Kept in one place
// so the "Акции и промокоды" task can swap the source for a database table
// (editable from /admin) without touching the components that render them.
export const PROMOS = {
  ru: [
    {
      id: "tea-gift",
      tone: "red",
      title: "Чай в подарок",
      body: "При заказе от 2000 ₽",
      action: "Заказать сейчас",
      target: "menu",
    },
    {
      id: "family-lunch",
      tone: "green",
      title: "Семейные обеды",
      body: "Скидка 20% по будням с 12:00 до 16:00",
      action: null,
      target: null,
    },
    {
      id: "free-delivery",
      tone: "gold",
      title: "Восток доставляет",
      body: "Бесплатная доставка при заказе от 2000 ₽",
      action: null,
      target: null,
    },
  ],
  uz: [
    {
      id: "tea-gift",
      tone: "red",
      title: "Choy sovgʻa",
      body: "2000 ₽ dan buyurtma qilganda",
      action: "Buyurtma berish",
      target: "menu",
    },
    {
      id: "family-lunch",
      tone: "green",
      title: "Oilaviy tushliklar",
      body: "Ish kunlari 12:00–16:00 da 20% chegirma",
      action: null,
      target: null,
    },
    {
      id: "free-delivery",
      tone: "gold",
      title: "Sharq yetkazadi",
      body: "2000 ₽ dan buyurtmalarga bepul yetkazib berish",
      action: null,
      target: null,
    },
  ],
};
