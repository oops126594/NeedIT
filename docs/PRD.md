# NEEDIT

## Product Requirements Document (PRD)

**Product:** NEEDIT
**Product Type:** Hyperlocal instant-commerce marketplace
**Initial Market:** Saudi Arabia
**Initial Launch Model:** One-city pilot
**Document Version:** 1.0
**Status:** Product Definition / MVP Planning

---

# 1. Executive Summary

NEEDIT is a hyperlocal marketplace that helps customers find and receive items they need **right now** from nearby physical stores.

Unlike traditional grocery delivery applications that primarily operate through their own inventories or predefined merchant catalogs, NEEDIT is designed around the customer's need:

> **“I need something. Find it for me.”**

A customer searches for an item, describes what they need, or selects a need-based category. NEEDIT searches participating nearby stores, identifies available products, compares relevant options, and allows the customer to order them for delivery.

NEEDIT's core value proposition is:

> **Need it? Get it.**

The platform connects three primary participants:

1. **Customers** — people looking for products immediately.
2. **Local merchants** — stores with physical inventory that want additional digital demand.
3. **Delivery partners** — couriers who transport orders from merchants to customers.

NEEDIT should initially focus on a narrow geographic market and a limited set of high-frequency/urgent categories rather than attempting to compete directly with established general-purpose quick-commerce platforms.

---

# 2. Product Vision

## Vision

Build the easiest way for people to answer:

> **“Where can I get this right now?”**

NEEDIT should eventually become a local **real-world search and fulfillment layer**.

Instead of users searching multiple apps, calling stores, visiting stores, or guessing whether something is available, NEEDIT provides one interface for discovering and obtaining locally available products.

## Long-Term Vision

NEEDIT evolves from:

**Product marketplace**

→ **Local inventory search**

→ **Need-based shopping assistant**

→ **Hyperlocal fulfillment network**

→ **Real-world commerce infrastructure**

---

# 3. Problem Statement

Consumers frequently need products that are:

* needed urgently;
* difficult to locate;
* available at multiple local stores;
* not worth travelling across the city to find;
* difficult to search for because users don't know the exact product name;
* unavailable on their preferred delivery platform.

Examples:

> “I need a USB-C cable tonight.”

> “I need supplies for a school project.”

> “I need balloons for a gathering.”

> “I need a notebook and some stationery.”

> “I need something to organize my room.”

The current experience often requires users to:

1. Search multiple delivery applications.
2. Search individual retailer websites.
3. Call stores.
4. Visit physical stores.
5. Compare availability and prices manually.

NEEDIT aims to reduce this friction.

---

# 4. Product Opportunity

Saudi Arabia has a highly developed delivery ecosystem, but that creates an important opportunity:

NEEDIT should **not** attempt to become another generic grocery-delivery application.

The differentiation is:

### Existing model

**Store → Catalog → Customer**

### NEEDIT model

**Customer need → Local inventory → Best available option → Delivery**

The product is therefore centered around **discovery**, not simply delivery.

---

# 5. Product Principles

NEEDIT should follow six principles.

### 5.1 Need-first

The customer starts with what they need rather than navigating complicated store catalogs.

### 5.2 Local-first

Nearby inventory should be prioritized.

### 5.3 Fast, but honest

Never promise delivery speeds that cannot realistically be achieved.

### 5.4 Simple

A customer should be able to go from:

**Need → Result → Order**

with minimal friction.

### 5.5 Transparent

Users should understand:

* product price;
* delivery fee;
* estimated delivery time;
* store;
* substitutions;
* order status.

### 5.6 Marketplace-first

NEEDIT should leverage existing local stores rather than requiring the company to own inventory from day one.

---

# 6. Target Users

## 6.1 Primary Customer

### Urban convenience-focused consumer

Characteristics:

* lives in a city;
* owns a smartphone;
* regularly uses delivery applications;
* values convenience;
* sometimes needs products urgently;
* does not necessarily know which store carries the product.

### Primary Jobs-to-be-Done

> “Help me find this item nearby.”

> “Help me get this item without leaving home.”

> “Tell me which nearby store actually has it.”

---

# 7. Secondary Customer Personas

## Persona A — The Emergency Shopper

**Scenario:**

A customer realizes they need something immediately.

Example:

> “My charger broke.”

Desired outcome:

**Find → Order → Receive**

---

## Persona B — The Last-Minute Planner

**Scenario:**

The customer suddenly needs several related items.

Example:

> “I have a birthday gathering tonight.”

Desired outcome:

NEEDIT recommends a relevant basket.

---

## Persona C — The Local Shopper

**Scenario:**

The customer knows the product but doesn't know which nearby stores sell it.

Desired outcome:

NEEDIT becomes the local inventory search engine.

---

## Persona D — The Merchant

A local store has products sitting on shelves but lacks a strong digital ordering channel.

Merchant needs:

* additional customers;
* digital visibility;
* simple inventory management;
* order management;
* delivery fulfillment.

---

## Persona E — Delivery Partner

Needs:

* clear pickup information;
* accurate store location;
* order details;
* efficient routing;
* delivery instructions;
* transparent earnings.

---

# 8. Core Value Proposition

## For Customers

> **Find what you need from nearby stores and get it delivered.**

## For Merchants

> **Turn your physical inventory into an online sales channel.**

## For Delivery Partners

> **Get nearby delivery jobs with clear pickup and drop-off information.**

## For NEEDIT

> **Become the discovery and fulfillment layer for local commerce.**

---

# 9. Product Scope

## MVP — In Scope

### Customer

* Account creation
* Login
* Location selection
* Home screen
* Search
* Categories
* Product results
* Store results
* Product details
* Cart
* Checkout
* Delivery address
* Order confirmation
* Order tracking
* Order history
* Notifications
* Basic support

### Merchant

* Merchant registration
* Store profile
* Product management
* Inventory status
* Pricing
* Order management
* Order acceptance
* Order preparation status
* Basic sales dashboard

### Admin

* Customer management
* Merchant management
* Product management
* Order management
* Delivery management
* Categories
* Promotions
* Basic analytics
* Customer support
* Platform configuration

### Delivery

For the initial prototype:

* simulated courier assignment;
* simulated delivery statuses;
* delivery tracking state machine.

Real courier infrastructure can be introduced later.

---

# 10. Explicitly Out of Scope for MVP

The MVP should **not** attempt to build:

* nationwide operations;
* autonomous delivery;
* proprietary warehouses;
* complex AI recommendation systems;
* advanced route optimization;
* loyalty ecosystem;
* subscription program;
* multi-country support;
* complex merchant accounting;
* sophisticated dynamic pricing;
* advanced advertising platform;
* fully automated inventory synchronization across every merchant;
* dozens of integrations.

The objective is to prove the **core product loop** first.

---

# 11. Core User Journey

## Customer Journey

### Step 1 — Open NEEDIT

Customer sees:

> **What do you need?**

Search field.

---

### Step 2 — Enter need

Example:

> `USB C cable`

---

### Step 3 — NEEDIT searches

System identifies:

* relevant products;
* nearby stores;
* estimated availability;
* price;
* distance;
* delivery estimate.

---

### Step 4 — Results

Example:

**USB-C Cable**

**Store A**

* 29 SAR
* Available
* 15–20 min

**Store B**

* 35 SAR
* Available
* 10–15 min

**Store C**

* 22 SAR
* Available
* 25–30 min

---

### Step 5 — Product selection

Customer chooses product.

---

### Step 6 — Cart

Customer reviews:

* product;
* quantity;
* subtotal;
* delivery fee;
* total.

---

### Step 7 — Checkout

Customer selects:

* address;
* delivery instructions;
* payment method.

---

### Step 8 — Order

Order status becomes:

**Order placed**

---

### Step 9 — Merchant

Merchant receives order.

**Preparing**

---

### Step 10 — Courier

Courier picks up order.

**Picked up**

---

### Step 11 — Delivery

Customer sees:

**On the way**

---

### Step 12 — Completion

**Delivered**

Customer can rate the experience.

---

# 12. Core Product Architecture

NEEDIT consists of five major systems.

```text
                 ┌──────────────────┐
                 │    CUSTOMER APP  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    NEEDIT API    │
                 └────────┬─────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 ┌────────────┐    ┌─────────────┐   ┌──────────────┐
 │ Marketplace│    │ Order System│   │ User System  │
 └────────────┘    └─────────────┘   └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
 ┌────────────┐    ┌─────────────┐   ┌──────────────┐
 │  Merchant   │    │  Delivery   │   │ Notifications│
 │   System    │    │   System    │   │    System   │
 └────────────┘    └─────────────┘   └──────────────┘
```

---

# 13. Customer Application

## 13.1 Home

The home screen should prioritize search.

### Components

**Header**

* NEEDIT logo
* location
* profile

**Primary search**

> 🔎 What do you need?

**Quick categories**

* School
* Home
* Tech
* Car
* Gifts
* Party
* Pets
* Stationery

**Recent searches**

**Popular needs**

**Nearby stores**

---

# 14. Search System

Search is the most important component of NEEDIT.

## Basic Search

Customer enters:

> headphones

System returns relevant products.

---

## Search Requirements

Search should support:

* product names;
* brands;
* categories;
* synonyms;
* partial matches;
* spelling mistakes;
* Arabic;
* English;
* mixed Arabic/English searches.

Example:

> شاحن آيفون

and:

> iPhone charger

should be capable of producing relevant results.

---

# 15. Need-Based Search

A major future differentiator.

Instead of:

> “USB cable”

Customer can enter:

> “I need a cable for my iPhone.”

The system identifies the underlying product intent.

Later:

> “I need everything for a school presentation.”

NEEDIT can suggest:

* presentation board;
* markers;
* tape;
* scissors;
* decorative materials.

The system should clearly distinguish:

**Search results**

from:

**AI-generated suggestions.**

AI must not falsely claim that a product is available.

---

# 16. Search Ranking

Initial ranking formula:

```text
Result Score =
Relevance
+ Availability
+ Distance
+ Delivery Speed
+ Merchant Reliability
+ Product Quality
```

The system should prioritize relevance before speed.

A completely irrelevant product should never rank highly simply because the store is close.

---

# 17. Product Page

Each product page should display:

* product name;
* image;
* price;
* availability;
* store;
* distance;
* estimated delivery;
* product description;
* quantity selector;
* add-to-cart button.

Example:

### USB-C Cable

**29 SAR**

Available at:

**Tech Store**

**1.4 km away**

Estimated delivery:

**15–20 min**

---

# 18. Store Page

Store pages should show:

* store name;
* logo;
* location;
* estimated delivery;
* rating;
* categories;
* available products;
* opening status.

Example:

### Tech Store

⭐ 4.7

**1.4 km away**

**15–20 min delivery**

---

# 19. Cart

Cart should contain:

* products;
* quantities;
* individual prices;
* subtotal;
* delivery fee;
* service fee if applicable;
* discounts;
* final total.

Example:

```text
USB-C Cable          29 SAR
Notebook             12 SAR
---------------------------
Subtotal             41 SAR
Delivery              8 SAR
---------------------------
Total                49 SAR
```

---

# 20. Checkout

Checkout requires:

### Address

* saved address;
* new address;
* delivery instructions.

### Payment

For MVP prototype:

* Cash on delivery simulation;
* mock card payment.

Production implementation should integrate a compliant payment provider.

### Confirmation

Customer sees:

**Estimated arrival: 15–25 minutes**

---

# 21. Order Tracking

Order lifecycle:

```text
PLACED
   ↓
ACCEPTED
   ↓
PREPARING
   ↓
READY_FOR_PICKUP
   ↓
COURIER_ASSIGNED
   ↓
PICKED_UP
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Failure states:

```text
CANCELLED
REJECTED
FAILED
```

---

# 22. Notifications

Customers receive notifications for:

* order accepted;
* order rejected;
* preparation started;
* courier assigned;
* order picked up;
* order arriving;
* order delivered;
* cancellation;
* refund/update.

---

# 23. Merchant Platform

Merchants require a separate interface.

## Dashboard

Display:

* today's orders;
* pending orders;
* completed orders;
* revenue;
* products;
* low-stock products.

---

# 24. Merchant Product Management

Merchant can:

* add product;
* upload image;
* set name;
* set price;
* select category;
* set stock status;
* edit product;
* deactivate product.

### Stock States

```text
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
```

---

# 25. Merchant Order Management

New order:

> **Order #NE10293**

Items:

* USB-C Cable × 1
* Notebook × 2

Merchant actions:

**Accept**

**Reject**

After acceptance:

**Preparing**

Then:

**Ready for pickup**

---

# 26. Merchant Reliability

NEEDIT should track merchant performance.

Metrics:

* acceptance rate;
* cancellation rate;
* preparation time;
* product availability accuracy;
* customer rating;
* complaint rate.

This information can later influence marketplace ranking.

---

# 27. Delivery System

The delivery system should initially be simple.

## Delivery States

```text
UNASSIGNED
ASSIGNED
AT_STORE
PICKED_UP
IN_TRANSIT
DELIVERED
```

The MVP can simulate this workflow.

Later, real delivery partners can be integrated.

---

# 28. Admin Dashboard

Administrators should have visibility into the entire marketplace.

## Dashboard

Display:

* active customers;
* active merchants;
* active orders;
* orders today;
* gross merchandise value;
* average order value;
* cancellation rate;
* average delivery time.

---

# 29. Admin Capabilities

Admin can:

### Customers

* view;
* suspend;
* investigate orders;
* handle support.

### Merchants

* approve;
* suspend;
* edit;
* inspect performance.

### Products

* approve;
* edit categories;
* deactivate.

### Orders

* inspect;
* manually update status;
* cancel;
* investigate issues.

---

# 30. Marketplace Model

NEEDIT should initially operate as a marketplace.

### Merchant

Provides:

**Inventory**

### NEEDIT

Provides:

**Discovery + Ordering + Marketplace**

### Delivery partner

Provides:

**Fulfillment**

This allows NEEDIT to scale inventory without owning every item.

---

# 31. Multi-Store Orders

### MVP recommendation

A cart should initially be restricted to **one merchant**.

Reason:

Multi-store carts introduce:

* multiple pickups;
* complex delivery calculations;
* split payments;
* order failures;
* substitutions;
* merchant coordination.

Therefore:

> **One order = one merchant**

for MVP.

Multi-store ordering can become a future capability.

---

# 32. Inventory Strategy

Inventory accuracy is one of NEEDIT's biggest operational challenges.

### MVP

Merchant manually updates stock.

### Phase 2

Merchant dashboard stock management.

### Phase 3

POS/API integrations.

### Phase 4

Near-real-time inventory synchronization.

---

# 33. Data Model

Core entities:

```text
User
Merchant
Store
Product
Category
Inventory
Cart
CartItem
Order
OrderItem
Address
Delivery
Payment
Review
Notification
Promotion
SupportTicket
```

---

# 34. Simplified Database Relationships

```text
User
 │
 ├── Addresses
 ├── Orders
 └── Reviews

Merchant
 │
 └── Store
      │
      ├── Products
      └── Orders

Product
 │
 ├── Category
 └── Inventory

Order
 │
 ├── OrderItems
 ├── Payment
 ├── Delivery
 └── Customer
```

---

# 35. Suggested Technical Architecture

For a modern MVP:

### Frontend

**Next.js / React**

### Backend

**Node.js**

### Database

**MongoDB**

### Authentication

Secure session/JWT-based authentication.

### API

REST API initially.

### Hosting

Cloud deployment such as Vercel for the frontend/application layer.

### Images

Cloud object storage.

### Maps

A mapping/location provider.

### Notifications

Push notification provider.

---

# 36. API Structure

Example API groups:

```text
/auth
/users
/products
/categories
/stores
/merchants
/search
/cart
/orders
/delivery
/payments
/reviews
/notifications
/admin
```

Example:

```text
GET /api/search?q=usb+cable

GET /api/products/:id

GET /api/stores/nearby

POST /api/cart

POST /api/orders

GET /api/orders/:id

PATCH /api/orders/:id/status
```

---

# 37. Security Requirements

NEEDIT should implement:

* encrypted passwords;
* secure authentication;
* authorization by role;
* server-side validation;
* rate limiting;
* input sanitization;
* secure API endpoints;
* protected admin routes;
* payment security;
* audit logs;
* secure environment variables.

Roles:

```text
CUSTOMER
MERCHANT
COURIER
ADMIN
```

Users must only access resources appropriate to their role.

---

# 38. Privacy

NEEDIT should minimize unnecessary customer data.

Potential data:

* name;
* phone;
* email;
* addresses;
* order history;
* approximate/current delivery location.

Sensitive data should never be exposed to merchants unnecessarily.

---

# 39. Performance Requirements

Target MVP performance:

### Home page

Target:

**< 2 seconds**

under normal network conditions.

### Search

Target:

**< 1 second**

for normal queries.

### Checkout

Target:

**< 2 seconds**

excluding external payment processing.

### API

Most standard API requests:

**< 500 ms**

under normal load.

---

# 40. Reliability

Critical services should prioritize availability:

* search;
* checkout;
* order creation;
* merchant order notifications;
* order status.

An order should never be silently lost.

Every order must have a unique identifier.

Example:

```text
NE-2026-000123
```

---

# 41. Analytics

Every major interaction should generate an analytics event.

Examples:

```text
app_opened
search_started
search_completed
product_viewed
store_viewed
product_added_to_cart
checkout_started
order_created
order_cancelled
order_delivered
review_submitted
```

---

# 42. North Star Metric

### Successful Need Fulfillment

**Percentage of customer searches that result in a successfully completed order.**

This measures whether NEEDIT actually solves the customer's need.

---

# 43. Key Product Metrics

## Acquisition

* new users;
* signup conversion;
* acquisition source.

## Activation

* first search;
* first product view;
* first cart;
* first order.

## Conversion

* search → product view;
* product view → cart;
* cart → checkout;
* checkout → order.

## Marketplace

* active merchants;
* products listed;
* inventory availability;
* orders per merchant.

## Delivery

* average delivery time;
* late delivery rate;
* failed delivery rate.

## Quality

* cancellation rate;
* refund rate;
* merchant rejection rate;
* customer rating.

## Retention

* 7-day retention;
* 30-day retention;
* repeat order rate.

---

# 44. Product Funnel

NEEDIT should track:

```text
APP OPEN
   ↓
SEARCH
   ↓
SEARCH RESULT
   ↓
PRODUCT VIEW
   ↓
ADD TO CART
   ↓
CHECKOUT
   ↓
ORDER
   ↓
DELIVERY
   ↓
REPEAT ORDER
```

The product team's job is to identify where users drop off.

---

# 45. MVP Success Criteria

The MVP should demonstrate:

### Customer validation

Customers can:

**Think of a need → search → find an item → order → receive it.**

### Merchant validation

A merchant can:

**Add inventory → receive order → prepare order → complete order.**

### Platform validation

NEEDIT can:

**Match demand with local inventory.**

---

# 46. MVP Acceptance Criteria

A feature is considered complete only when:

* happy path works;
* error states are handled;
* loading states exist;
* mobile layout works;
* authorization is enforced;
* data persists correctly;
* analytics events fire;
* user receives appropriate feedback.

---

# 47. Example End-to-End Scenario

### Customer

Searches:

> `birthday balloons`

NEEDIT finds:

**Party Store**

Balloons:

**19 SAR**

Distance:

**2.1 km**

Estimated delivery:

**18 minutes**

Customer selects:

**Add to cart**

Checkout:

```text
Balloons              19 SAR
Delivery                8 SAR
-----------------------------
Total                  27 SAR
```

Customer places order.

Merchant receives:

> New NEEDIT order #NE10582

Merchant accepts.

Status:

**Preparing**

Courier is assigned.

Status:

**Picked up**

Customer sees:

**Arriving in ~8 minutes**

Order arrives.

Status:

**Delivered**

Customer rates:

⭐⭐⭐⭐⭐

The entire loop is the core NEEDIT product.

---

# 48. Phase Roadmap

## Phase 0 — Product Prototype

Goal:

Validate UX.

Build:

* customer UI;
* mock stores;
* mock products;
* mock search;
* cart;
* checkout;
* simulated order tracking.

No real marketplace operations.

---

## Phase 1 — Functional MVP

Build:

* real authentication;
* real database;
* merchant dashboard;
* real product data;
* real orders;
* admin dashboard.

---

## Phase 2 — Pilot

Launch in one geographic area.

Focus on:

* limited merchants;
* limited categories;
* real customers;
* real fulfillment.

---

## Phase 3 — Marketplace Expansion

Add:

* more merchants;
* more categories;
* courier operations;
* inventory synchronization;
* improved search;
* merchant analytics.

---

## Phase 4 — Intelligent NEEDIT

Add:

* natural-language search;
* semantic product matching;
* need-based baskets;
* personalized recommendations;
* smarter ranking;
* demand prediction;
* merchant insights.

---

# 49. Future AI Layer

AI should **not** be the product.

AI should make NEEDIT better.

Potential capabilities:

### Intent understanding

User:

> “I need something to charge my phone.”

System understands:

**Charging accessory**

---

### Natural-language shopping

> “I need supplies for a school presentation tomorrow.”

System proposes relevant products.

---

### Smart alternatives

If:

> Product A unavailable

NEEDIT can suggest:

> Product B

provided that the alternative is genuinely compatible.

---

### Search correction

User:

> “usbc cble”

System understands:

> USB-C cable

---

### Personalized discovery

Based on legitimate product interaction data:

> “You might also need…”

---

# 50. Business Model

Potential revenue streams:

## Commission

NEEDIT takes a percentage from completed merchant orders.

---

## Delivery Fee

Customer pays a delivery fee.

---

## Merchant Subscription

Future option:

Merchants pay for additional tools.

Potential features:

* analytics;
* promoted placement;
* advanced inventory tools;
* sales reports.

---

## Sponsored Placement

Future:

Merchants can promote products.

This must be clearly labeled as sponsored.

---

# 51. Unit Economics

For every order, track:

```text
Revenue
- Merchant commission
- Delivery cost
- Payment processing
- Refunds
- Promotions
- Customer support
= Contribution margin
```

NEEDIT should not optimize only for order volume.

The platform needs to understand whether each order contributes economically.

---

# 52. Major Risks

## Risk 1 — Inventory is inaccurate

Customer orders something that isn't actually available.

### Mitigation

* inventory timestamps;
* merchant stock confirmation;
* merchant reliability score;
* automatic product deactivation after repeated failures.

---

## Risk 2 — Delivery is expensive

Small orders may not generate enough revenue.

### Mitigation

* minimum order value;
* delivery fee;
* geographic density;
* batching;
* merchant-funded promotions.

---

## Risk 3 — Customer acquisition

Established delivery platforms already have large user bases.

### Mitigation

NEEDIT should focus on a differentiated job:

> **Find the thing I need.**

rather than:

> “We also deliver groceries.”

---

## Risk 4 — Merchant adoption

Small businesses may not want complicated software.

### Mitigation

Merchant onboarding should take minutes, not hours.

---

## Risk 5 — Search quality

If users repeatedly search and find nothing useful, they won't return.

### Mitigation

Invest heavily in:

* search relevance;
* synonyms;
* Arabic/English support;
* category mapping;
* inventory accuracy.

---

# 53. Competitive Positioning

NEEDIT should not position itself as:

> “Another fast grocery app.”

Instead:

> **“The app that finds what you need nearby.”**

### Strategic distinction

| Traditional quick commerce       | NEEDIT                    |
| -------------------------------- | ------------------------- |
| Browse stores                    | Search for a need         |
| Mostly predefined catalogs       | Local inventory discovery |
| Platform inventory often central | Local merchant inventory  |
| Grocery-heavy                    | Broad everyday needs      |
| Store-first                      | Customer-first            |
| Delivery is the primary value    | Discovery + delivery      |

---

# 54. Geographic Launch Strategy

The initial product should launch in **one city and one tightly defined service area**.

The purpose is to establish:

* merchant density;
* delivery reliability;
* inventory accuracy;
* repeat usage.

Expansion should occur only after the local marketplace demonstrates healthy operational metrics.

---

# 55. Initial Category Strategy

Rather than launching with everything, begin with categories where customers commonly have urgent or inconvenient shopping needs.

### Suggested initial categories

**Tech essentials**

* charging cables;
* adapters;
* basic accessories.

**Stationery**

* notebooks;
* pens;
* folders;
* project supplies.

**Home essentials**

* basic household items;
* organization products.

**Party**

* decorations;
* disposable serving supplies;
* simple event supplies.

**Gifts**

* gift bags;
* wrapping supplies;
* simple gift items.

The category mix should ultimately be validated through actual search demand.

---

# 56. UX Design Direction

NEEDIT should feel:

**Fast**

**Modern**

**Trustworthy**

**Simple**

**Local**

The primary UI element should be the search bar.

### Example

```text
┌──────────────────────────────────┐
│ NEEDIT                 📍 Home   │
│                                  │
│ What do you need? 🔎             │
│                                  │
│ ──────────────────────────────── │
│                                  │
│ Popular needs                    │
│                                  │
│ 📚 School    🎁 Gifts            │
│ 🏠 Home      💻 Tech             │
│ 🎉 Party     🚗 Car              │
│                                  │
│ Nearby stores                    │
│                                  │
│ Tech Store        15 min         │
│ Party Store       18 min         │
└──────────────────────────────────┘
```

---

# 57. Design System

### Typography

Use a highly readable modern sans-serif.

### Components

* rounded cards;
* clear buttons;
* large search field;
* strong hierarchy;
* minimal clutter;
* clear status indicators.

### Mobile-first

NEEDIT is primarily a mobile product.

Desktop merchant/admin interfaces can be optimized separately.

---

# 58. Accessibility

NEEDIT should support:

* readable text;
* sufficient contrast;
* large touch targets;
* clear error messages;
* keyboard accessibility where applicable;
* screen-reader labels;
* Arabic RTL support.

---

# 59. Localization

Because the initial market is Saudi Arabia:

### Required

**Arabic**

**English**

The architecture should support:

```text
LTR
RTL
```

Product names and merchant-provided content may require bilingual handling.

---

# 60. Customer Support

MVP:

* FAQ;
* order issue form;
* contact support;
* order-specific support.

Common issue types:

```text
Missing item
Wrong item
Damaged item
Late delivery
Order cancelled
Payment issue
Merchant issue
Other
```

---

# 61. Order Cancellation

Customer can cancel before a defined fulfillment stage.

Example:

```text
PLACED       → CAN CANCEL
ACCEPTED     → CAN CANCEL
PREPARING    → LIMITED
READY        → NO
PICKED UP    → NO
DELIVERED    → NO
```

Exact cancellation/refund rules should be configurable.

---

# 62. Product Availability

Every product should have a freshness indicator internally.

Example:

```text
inventoryUpdatedAt
```

NEEDIT can use this to determine how trustworthy an availability result is.

---

# 63. Merchant Ranking

Merchant ranking should consider measurable factors such as:

* product relevance;
* availability;
* delivery estimate;
* distance;
* reliability;
* customer experience.

The ranking system should remain explainable enough for internal monitoring.

---

# 64. Fraud & Abuse

Future requirements include detection of:

* fake orders;
* repeated cancellation abuse;
* fraudulent merchant activity;
* payment abuse;
* fake reviews;
* account abuse.

Admin should have tools to investigate suspicious activity.

---

# 65. Notifications Architecture

Notification channels can eventually include:

* push;
* SMS;
* email;
* in-app.

The MVP should prioritize in-app and push notifications.

---

# 66. Development Priorities

## P0 — Must Have

* search;
* products;
* stores;
* cart;
* checkout;
* order creation;
* order status;
* merchant orders;
* admin order management.

## P1 — Important

* Arabic/English;
* reviews;
* notifications;
* merchant analytics;
* inventory management.

## P2 — Future

* AI search;
* smart baskets;
* personalization;
* multi-store carts;
* advanced courier optimization;
* subscriptions.

---

# 67. Definition of Done

NEEDIT MVP is ready for pilot when:

* customer can successfully create an account;
* customer can search products;
* customer can see nearby stores;
* customer can add products to cart;
* customer can checkout;
* merchant receives the order;
* merchant can accept and prepare the order;
* delivery state can be updated;
* customer can track order;
* admin can monitor orders;
* failed states are handled;
* Arabic and English interfaces work;
* basic analytics are implemented;
* security controls are implemented.

---

# 68. Product Success Definition

NEEDIT is successful when customers stop thinking:

> “Which app should I search?”

and start thinking:

> **“I'll just search NEEDIT.”**

That is the central product objective.

---

# 69. Final Product Statement

### NEEDIT

**Need it? Get it.**

NEEDIT is a hyperlocal marketplace that connects customers with products available in nearby physical stores.

The customer describes what they need.

NEEDIT finds relevant local inventory.

The customer chooses an option.

The merchant prepares the order.

A delivery partner delivers it.

The long-term ambition is to make NEEDIT the **local search engine for things people need in the real world**, combined with the infrastructure required to actually get those things to them.

