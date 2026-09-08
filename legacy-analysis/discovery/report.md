# SX-0001 Legacy Application Discovery Report

## Executive Summary

This is a **Sun Java Petstore 1.3.2** reference implementation – a J2EE e-commerce application demonstrating enterprise Java patterns from the early 2000s. The system implements a complete shopping workflow from catalog browsing through order fulfillment, with an order-approval layer and supplier integration.

**Total Codebase:** ~45,000 lines across 19 major modules  
**Architecture:** EJB 2.0 + Struts web framework + JMS + SQLite/Cloudscape database  
**User-Facing:** 3 web applications (petstore, admin, supplier) + framework  
**Languages:** Java, JSP, XML configuration, SQL

---

## Architecture Overview

### Layering

The system follows a classic J2EE three-tier pattern:

```
Web Tier (Struts + JSP)
    ↓
EJB Component Tier (Session Beans, Entity Beans)
    ↓
Database Tier (Cloudscape / SQLite)
```

### Application Structure

1. **apps/petstore** – Customer-facing shopping application
   - Catalog browsing, search
   - Shopping cart management
   - Customer account/profile
   - Order checkout and placement
   - Locale-aware UI (en_US, ja_JP, zh_CN)

2. **apps/opc** – Order Processing Center (backend service)
   - Order approval workflow with business rules
   - JMS-based async message processing
   - Supplier PO generation and routing
   - Customer notification triggering

3. **apps/admin** – Administrative interface
   - Order management and status tracking
   - System configuration and monitoring

4. **apps/supplier** – Supplier-side order fulfillment
   - Receives POs from OPC
   - Manages order delivery status

### Component Architecture

The 16 shared components implement cross-cutting concerns:

| Component | Purpose | Pattern |
|-----------|---------|---------|
| **catalog** | Product/category/item browsing | EJB entity beans + Struts action |
| **cart** | Shopping cart session state | Stateful session EJB |
| **customer** | Customer account CRUD | EJB entity bean |
| **creditcard** | Payment instrument storage | EJB entity bean |
| **purchaseorder** | Order entity and lifecycle | EJB entity bean |
| **lineitem** | Order line-item details | EJB entity bean |
| **signon** | Authentication + filter | Servlet filter + JSP form handler |
| **contactinfo** | Addresses and contact data | EJB entity bean |
| **processmanager** | Workflow/state-machine engine | Event-driven transition delegates |
| **asyncsender** | JMS message async dispatch | Message-driven bean |
| **mailer** | Email content generation | Mail composition, XML templates |
| **xmldocuments** | Order/approval XML serialization | XML marshalling |
| **address** | Address validation and management | Address entity |
| **uidgen** | Unique ID generation | Service locator pattern |
| **servicelocator** | JNDI lookup abstraction | Service locator pattern |
| **encodingfilter** | UTF-8 request encoding | Servlet filter |
| **waf** | Web Application Framework | Struts MVC + template servlet |

### Integration Points

- **JMS Queues**: PurchaseOrder → Supplier, OrderApproval → Mail, Invoice → Mail
- **EJB Local Interfaces**: Synchronous component-to-component calls within VM
- **Servlet Filters**: Encoding, authentication, authorization (web.xml declarative)
- **XML Messages**: Order, PO, approval, invoice documents passed via JMS

---

## Data Model Summary

### Core Entities

**Catalog:**
- Category → Product → Item (multi-level hierarchy)
- Locale-specific details (names, descriptions, images)
- Price data (listprice, unitcost)

**Customer:**
- Account (email, locale, sign-on credentials)
- Profile (contact info, addresses)
- Credit cards (number, type, expiry)

**Orders:**
- Purchase Order (date, value, status, line items)
- Line Items (item reference, quantity, unit price)
- Order Status (workflow states: pending, approved, denied, fulfilled)

**Business Rules Layer:**
- Order approval thresholds (stored in OPC transition logic, not schema)
- Credit card validation (expiry format MM/YYYY)
- Inventory/availability (catalog attribute driven)

### Database Platforms

- **Development:** Cloudscape (Derby predecessor)
- **Production:** Oracle (schema variants in PopulateSQL.xml)
- **Test:** In-memory SQLite (VITEST mode in db/client.ts pattern – not present here, but infrastructure assumes it)

---

## Key Business Flows

### Flow 1: Shopping (petstore app)

1. Browse catalog (category → product → item)
2. Add items to cart (stateful session EJB)
3. Sign on / create account
4. Enter order info (billing, shipping)
5. Submit order → PurchaseOrderEJB created
6. Redirect to order completion page

### Flow 2: Order Approval (OPC app)

1. PurchaseOrderMDB receives order message
2. OrderApprovalTD evaluates order against thresholds
3. If approved: emit SupplierPO to supplier queue + approval email
4. If denied: emit rejection email to customer
5. Order status updated (approved/denied)

### Flow 3: Supplier Fulfillment (supplier app)

1. SupplierOrderMDB receives PO
2. Fulfill items, update delivery status
3. Emit invoice back to OPC
4. OPC → order marked complete
5. Customer receives completion email

### Flow 4: Admin Monitoring (admin app)

1. Browse all orders
2. View order status and line items
3. Manual override or re-approval capability (not fully detailed in source)

---

## Technology Stack

| Layer | Technology | Version Era |
|-------|-----------|------------|
| **Web Framework** | Struts 1.x | 2002–2005 |
| **EJB** | EJB 2.0 | 2002–2003 |
| **Servlet API** | 2.3 | 2002 |
| **Messaging** | JMS 1.0 | 2002 |
| **Database** | SQL92 + Cloudscape/Oracle | 2002 |
| **XML** | DOM/SAX, XML 1.0 | 2002 |
| **Build** | Ant (implied from build.xml) | 2002 |
| **Java** | JDK 1.4 (implied, no source version tags) | 2002–2003 |

---

## Known Constraints & Observations

### Architectural Constraints

1. **Stateful Cart**: Shopping cart is a Stateful Session EJB, requiring sticky session in production
2. **No Persistence Context Boundaries**: EJB 2.0 CMP fields are tightly coupled to the entity lifecycle
3. **Synchronous Approval Evaluation**: OrderApprovalTD runs inline in message processing; approval rules cannot be externalized/versioned
4. **JMS Coupling**: Order flows depend on queue availability; no circuit breaker or retry logic visible
5. **No Distributed Tracing**: Order ID is the only context; no correlation IDs across systems

### Code Observations

1. **Bare Literals**: Approval thresholds, timeout values, email templates hardcoded in Java/JSP
2. **No Configuration Externalization**: JNDI lookups for queues/factories; no property file override
3. **Locale Handling**: Language variants (en_US, ja_JP, zh_CN) managed as discrete JSP/XML files, not translatable property bundles
4. **Error Paths Undocumented**: Exception swallowing in several message handlers; error recovery paths unclear
5. **Test Coverage Unclear**: No test directories found; reachability of some components unconfirmed

### Data Model Observations

1. **Order Lifecycle**: Status stored as VARCHAR in PurchaseOrderEJB; no referential enum; state transitions implicit in code
2. **No Audit Trail**: Order updates not logged; approval decisions not timestamped or attributed to users
3. **Credit Card Storage**: Card numbers stored in plaintext in entity bean; no PCI compliance measures visible
4. **Inventory Tracking**: No stock/availability fields; catalog assumes unlimited inventory

---

## Module Dependency Map (Simplified)

```
petstore (web app)
  ├─ cart (component)
  ├─ catalog (component)
  ├─ customer (component)
  ├─ creditcard (component)
  ├─ purchaseorder (component)
  ├─ signon (component)
  ├─ contactinfo (component)
  └─ waf (framework)

opc (web app)
  ├─ purchaseorder (component)
  ├─ processmanager (component)
  ├─ xmldocuments (component)
  ├─ mailer (component)
  ├─ supplierpo (component)
  ├─ lineitem (component)
  └─ asyncsender (component)

admin (web app)
  ├─ purchaseorder (component)
  ├─ customer (component)
  ├─ lineitem (component)
  └─ waf (framework)

supplier (web app)
  ├─ purchaseorder (component)
  ├─ lineitem (component)
  └─ waf (framework)

waf (framework)
  ├─ signon (component)
  ├─ encodingfilter (component)
  └─ uidgen (component)
```

**Critical Path:** petstore → purchaseorder → opc → supplier (order fulfillment)

---

## Risk Assessment

### High-Risk Modules (Extract First)

1. **apps/petstore** (18,460 LOC, 30+ screens)
   - Customers interact directly; UI/UX requirements
   - Cart session state, order submission triggers approval flow
   - Multilingual; locale-specific data flows

2. **apps/opc** (5,212 LOC, 1 screen)
   - Core business logic: order approval thresholds, routing rules
   - JMS integration point; coupling to downstream systems
   - Asynchronous message processing; error handling complex

3. **components/purchaseorder** (2,366 LOC)
   - Central entity; referenced by petstore, opc, admin, supplier
   - Order lifecycle state machine implicit in code

4. **components/creditcard** (769 LOC)
   - Payment domain; data sensitivity (card numbers stored plaintext)
   - Expiry validation logic

### Medium-Risk Modules (Extract Second Wave)

5. **apps/admin** (5,497 LOC, 4 screens) – Order management interface
6. **components/customer** (2,385 LOC) – Account creation, profile updates
7. **components/catalog** (2,866 LOC) – Product browsing, search
8. **components/processmanager** (1,322 LOC) – Workflow engine; state transitions
9. **components/signon** (1,559 LOC) – Authentication; web filter integration
10. **components/supplierpo** (1,924 LOC) – Supplier order fulfillment

### Low-Risk Modules (Extract as Needed)

11–18. Mailer, AsyncSender, LineItem, ContactInfo, Address, XMLDocuments, UIDGen, ServiceLocator – supporting services

---

## Extraction Strategy

### Phase 1: Understand (This Report)

- ✅ Module inventory with LOC counts
- ✅ Dependency map
- ✅ Business flow overview
- ✅ Technology stack

### Phase 2: Extract High-Risk

1. **apps/petstore** – User-facing requirements
2. **apps/opc** – Order approval business rules, thresholds, routing
3. **components/purchaseorder** – Order entity lifecycle, status definitions
4. **components/creditcard** – Payment validation, card acceptance rules

### Phase 3: Extract Medium-Risk

5–10. Customer account, catalog, admin UI, signon, processmanager, supplierpo

### Phase 4: Extract Remaining

Utilities, email, document generation, as context requires

---

## Exclusions & Out-of-Scope

1. **Build System**: Ant build.xml files (build instruction, not business requirement)
2. **Deployment Descriptors**: sun-j2ee-ri.xml, application.xml (deployment topology, not functional requirement)
3. **Test Infrastructure**: Likely absent or minimal; not extracted
4. **Documentation**: Design docs, user guides in /docs (reference only)
5. **Internationalization Translations**: Locale-specific JSP/XML handled as one i18n capability, not 19 separate requirements
6. **WAF Framework Internals**: Struts routing, servlet plumbing (implementation detail; requirement is "web app responds to routes")

---

## Next Steps

1. **Extract Phase 1 Modules** (petstore, opc, purchaseorder, creditcard)
2. **Document Business Rules** – Approval thresholds, order lifecycle states, payment validation
3. **Map UI Screens** – 30+ petstore screens to functional areas
4. **Identify Data Transformations** – XML message format, order aggregation
5. **Clarify Error Paths** – What happens on queue failure, payment rejection, approval conflict?
6. **Confirm Reachability** – Verify all code paths are live (some EJB methods may be unused)

