# Payment Processing — Implementation Tasks

## 1. Data Model

- [x] 1.1 Define CreditCard entity with number, type, expiry, cardholder (SWHM-T-0175)
- [x] 1.2 Store cards encrypted in database (SWHM-T-0175)

## 2. Validation

- [x] 2.1 Validate card number format (SWHM-T-0176)
- [x] 2.2 Validate expiry date not expired (SWHM-T-0176)
- [x] 2.3 Validate card type against accepted list (SWHM-T-0176)

## 3. Authorization

- [x] 3.1 Integrate with payment gateway (SWHM-T-0177)
- [x] 3.2 Send card details for authorization (SWHM-T-0177)
- [x] 3.3 Handle authorization responses (SWHM-T-0177)

## 4. Testing

- [ ] 4.1 Test card validation with valid/invalid cards (SWHM-T-0178)
- [ ] 4.2 Test expiry validation (SWHM-T-0178)
- [ ] 4.3 Test authorization flow (SWHM-T-0178)
