export type Role = "USER" | "TENANT" | "ADMIN";

export type Me = {
  id: number;
  username: string;
  full_name: string | null;
  role: Role;
  tenant_id: number | null;
  tenant_name: string | null;
  isBrandStaffLoggedIn?: boolean;
};

export type Tokens = {
  access_token: string;
  refresh_token: string | null;
  expires_in: number | null;
  token_type: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  tenant_id: number;
  category_id: number;
  tenant_name: string | null;
  category_name: string | null;
  has_image: boolean;
  image_version: string | null;
};

export type ProductPage = {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type Category = {
  id: number;
  name: string;
};

export type Brand = {
  id: number;
  name: string;
};

export type UserAddress = {
  id: number;
  label: string | null;
  recipient_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

export type AddressPage = {
  addresses: UserAddress[];
};

export type ShippingAddress = {
  address_id: number | null;
  label: string | null;
  recipient_name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
};

export type OrderStatus = "placed" | "shipped" | "delivered" | "cancelled";
export type ReturnStatus = "requested" | "approved" | "rejected";

export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string | null;
  tenant_name?: string | null;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  user_id: number;
  total_quantity: number;
  total_amount: number;
  status: OrderStatus;
  return_status: ReturnStatus | null;
  shipping_address: ShippingAddress | null;
  items: OrderItem[];
};

export type ApiCartLine = {
  product_id: number;
  name: string;
  price: number;
  tenant_name: string | null;
  quantity: number;
  available: number;
};

export type CartResponse = {
  items: ApiCartLine[];
};

export type OrderPage = {
  orders: Order[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type OrderCreated = {
  message: string;
  order_id: number;
  total_quantity: number;
  total_amount: number;
  items: Array<{
    product_id: number;
    product_name: string | null;
    quantity: number;
    price: number;
  }>;
};

export type TenantSummary = {
  id: number;
  name: string;
  product_count: number;
  staff_count: number;
};

export type StaffUser = {
  id: number;
  username: string;
  role: string | null;
  tenant_id: number;
  tenant_name: string | null;
};

export type SignupResult = {
  message: string;
  user_id: number;
  username: string;
};
