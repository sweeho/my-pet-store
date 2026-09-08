-- EXTRACTED FROM LEGACY SOURCE — evidence of what exists, not a build target. Where this disagrees with a capability delta spec, the delta spec wins.

-- Category and localized details
create table category (
  catid char(10) not null,
  constraint pk_category primary key (catid)
);

create table category_details (
  catid char(10) not null,
  name varchar(80) not null,
  image varchar(255),
  descn varchar(255),
  locale char(10) not null,
  constraint pk_category_details primary key (catid, locale),
  constraint fk_category_details_1 foreign key (catid) references category (catid)
);

-- Product and localized details
create table product (
  productid char(10) not null,
  catid char(10) not null,
  constraint pk_product primary key (productid),
  constraint fk_product_1 foreign key (catid) references category (catid)
);

create table product_details (
  productid char(10) not null,
  name varchar(80) not null,
  descn varchar(255),
  image varchar(255),
  locale char(10) not null,
  constraint pk_product_details primary key (productid, locale),
  constraint fk_product_details_1 foreign key (productid) references product (productid)
);

-- Item and localized details with dual pricing
create table item (
  itemid char(10) not null,
  productid char(10) not null,
  constraint pk_item primary key (itemid),
  constraint fk_item_1 foreign key (productid) references product (productid)
);

create table item_details (
  itemid char(10) not null,
  listprice decimal(10,2) not null,
  unitcost decimal(10,2) not null,
  locale char(10) not null,
  image char(255) not null,
  descn varchar(255) not null,
  attr1 varchar(80),
  attr2 varchar(80),
  attr3 varchar(80),
  attr4 varchar(80),
  attr5 varchar(80),
  constraint pk_item_details primary key (itemid, locale),
  constraint fk_item_details_1 foreign key (itemid) references item (itemid)
);

-- User authentication
create table user (
  userName varchar(25) not null,
  password varchar(255) not null,
  constraint pk_user primary key (userName)
);

-- Customer account and profile
create table customer (
  userId varchar(10) not null,
  userName varchar(25) not null unique,
  email varchar(80),
  constraint pk_customer primary key (userId),
  constraint fk_customer_1 foreign key (userName) references user (userName)
);

create table contact_info (
  contactId varchar(20) not null,
  customerId varchar(10) not null,
  givenName varchar(80),
  familyName varchar(80),
  email varchar(80),
  phone varchar(20),
  constraint pk_contact_info primary key (contactId),
  constraint fk_contact_info_1 foreign key (customerId) references customer (userId)
);

create table address (
  addressId varchar(20) not null,
  street1 varchar(80),
  street2 varchar(80),
  city varchar(80),
  state varchar(80),
  postalCode varchar(20),
  country varchar(80),
  constraint pk_address primary key (addressId)
);

create table profile (
  userId varchar(10) not null,
  preferredLanguage char(10),
  favoriteCategory char(10),
  myListPreference varchar(255),
  bannerPreference varchar(255),
  constraint pk_profile primary key (userId),
  constraint fk_profile_1 foreign key (userId) references customer (userId)
);

-- Credit card
create table credit_card (
  cardId varchar(20) not null,
  customerId varchar(10),
  cardNumber varchar(20),
  cardType varchar(20),
  expiryDate varchar(10),
  constraint pk_credit_card primary key (cardId),
  constraint fk_credit_card_1 foreign key (customerId) references customer (userId)
);

-- Purchase order and line items
create table purchase_order (
  orderId varchar(20) not null,
  customerId varchar(10),
  userId varchar(10),
  emailId varchar(80),
  orderDate datetime,
  totalPrice decimal(10,2),
  orderStatus varchar(20),
  locale char(10),
  constraint pk_purchase_order primary key (orderId)
);

create table line_item (
  lineItemId varchar(20) not null,
  orderId varchar(20),
  categoryId char(10),
  productId char(10),
  itemId char(10),
  lineNumber varchar(10),
  quantity integer,
  unitPrice decimal(10,2),
  quantityShipped integer default 0,
  constraint pk_line_item primary key (lineItemId),
  constraint fk_line_item_1 foreign key (orderId) references purchase_order (orderId),
  constraint fk_line_item_2 foreign key (itemId) references item (itemId)
);

-- Supplier order for fulfillment
create table supplier_order (
  supplierId varchar(20) not null,
  orderId varchar(20),
  orderDate datetime,
  orderStatus varchar(20),
  constraint pk_supplier_order primary key (supplierId),
  constraint fk_supplier_order_1 foreign key (orderId) references purchase_order (orderId)
);
