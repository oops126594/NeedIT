export const PILOT_PASSWORD = "Store-merchant-1";

export const PILOT_ADMIN = {
  email: "admin@needit.test",
  password: "Admin-needit-1",
  name: "NEEDIT Admin",
};

export const PILOT_MERCHANT = {
  email: "merchant.farah@needit.test",
  password: PILOT_PASSWORD,
  name: "Farah Merchant",
  storeId: "farah",
};

export const PILOT_COURIERS = [
  {
    id: "courier-bayan",
    email: "courier.bayan@needit.test",
    password: PILOT_PASSWORD,
    name: "Bayan Al Harbi",
    phone: "0551112233",
  },
  {
    id: "courier-fahad",
    email: "courier.fahad@needit.test",
    password: PILOT_PASSWORD,
    name: "Fahad Al Otaibi",
    phone: "0554445566",
  },
] as const;
