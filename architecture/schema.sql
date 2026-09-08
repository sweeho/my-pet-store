-- EXTRACTED FROM LEGACY SOURCE — evidence of what exists, not a build target. Where this disagrees with a capability delta spec, the delta spec wins.

CREATE TABLE CUSTOMER (
    user_id VARCHAR(25) PRIMARY KEY NOT NULL,
    password VARCHAR(255) NOT NULL,
    locale VARCHAR(10)
);

CREATE TABLE ACCOUNT (
    account_id VARCHAR(36) PRIMARY KEY NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);

CREATE TABLE PROFILE (
    profile_id VARCHAR(36) PRIMARY KEY NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en_US',
    favorite_category VARCHAR(50),
    my_list_preference BOOLEAN DEFAULT TRUE,
    banner_preference BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);

CREATE TABLE CONTACTINFO (
    contact_info_id VARCHAR(36) PRIMARY KEY NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    given_name VARCHAR(30) NOT NULL,
    family_name VARCHAR(30) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(50) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id)
);

CREATE TABLE ADDRESS (
    address_id VARCHAR(36) PRIMARY KEY NOT NULL,
    contact_info_id VARCHAR(36) NOT NULL,
    street_name_1 VARCHAR(70),
    street_name_2 VARCHAR(70),
    city VARCHAR(30),
    state VARCHAR(30),
    zip_code VARCHAR(20),
    country VARCHAR(30),
    FOREIGN KEY (contact_info_id) REFERENCES CONTACTINFO(contact_info_id)
);

CREATE TABLE CREDITCARD (
    card_id VARCHAR(36) PRIMARY KEY NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    card_type VARCHAR(50),
    expiry_date VARCHAR(7),
    FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id)
);

CREATE TABLE CATEGORY (
    category_id VARCHAR(50) PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE PRODUCT (
    product_id VARCHAR(50) PRIMARY KEY NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
);

CREATE TABLE ITEM (
    item_id VARCHAR(50) PRIMARY KEY NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    price DECIMAL(10,2),
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id),
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
);

CREATE TABLE LOCALE_CONTENT (
    content_id VARCHAR(36) PRIMARY KEY NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    locale VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
);

CREATE TABLE PURCHASEORDER (
    po_id VARCHAR(36) PRIMARY KEY NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    po_date TIMESTAMP NOT NULL,
    total_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id)
);

CREATE TABLE LINEITEM (
    line_id VARCHAR(36) PRIMARY KEY NOT NULL,
    po_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    line_number INTEGER,
    quantity INTEGER NOT NULL,
    quantity_shipped INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (po_id) REFERENCES PURCHASEORDER(po_id),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id)
);

CREATE TABLE INVENTORY (
    item_id VARCHAR(50) PRIMARY KEY NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id)
);

CREATE TABLE SUPPLIER (
    supplier_id VARCHAR(36) PRIMARY KEY NOT NULL,
    name VARCHAR(100)
);

CREATE TABLE INVOICE (
    invoice_id VARCHAR(36) PRIMARY KEY NOT NULL,
    po_id VARCHAR(36) NOT NULL,
    invoice_date TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES PURCHASEORDER(po_id)
);

CREATE INDEX idx_customer_locale ON CUSTOMER(locale);
CREATE INDEX idx_account_user_id ON ACCOUNT(user_id);
CREATE INDEX idx_profile_user_id ON PROFILE(user_id);
CREATE INDEX idx_contactinfo_account_id ON CONTACTINFO(account_id);
CREATE INDEX idx_address_contact_info_id ON ADDRESS(contact_info_id);
CREATE INDEX idx_creditcard_account_id ON CREDITCARD(account_id);
CREATE INDEX idx_item_category_id ON ITEM(category_id);
CREATE INDEX idx_item_product_id ON ITEM(product_id);
CREATE INDEX idx_purchaseorder_user_id ON PURCHASEORDER(user_id);
CREATE INDEX idx_purchaseorder_status ON PURCHASEORDER(status);
CREATE INDEX idx_lineitem_po_id ON LINEITEM(po_id);
CREATE INDEX idx_lineitem_item_id ON LINEITEM(item_id);
