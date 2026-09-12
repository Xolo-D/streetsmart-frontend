# StreetSmart — Frontend Dashboard

Modern gradient-themed dashboard for AI-powered street vendor inventory management.

## Features

- Email + password login (JWT-based)
- Three role-specific dashboards: Vendor, Supplier, Administrator
- Interactive charts via Chart.js
- AI reorder recommendations

## Setup

~~~
# In one terminal — start the backend
cd ../streetsmart-backend && npm run dev

# In another terminal — serve the frontend
python3 -m http.server 5500
~~~

Then open http://localhost:5500

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Vendor | vendor@streetsmart.co.za | vendor123 |
| Supplier | supplier@streetsmart.co.za | supplier123 |
| Admin | admin@streetsmart.co.za | admin123 |
