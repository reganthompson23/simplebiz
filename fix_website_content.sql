-- Fix website content for all websites
update websites
set content = '{
  "businessName": "",
  "aboutUs": "",
  "services": [""],
  "contactInfo": {
    "phone": "",
    "email": "",
    "address": ""
  },
  "leadForm": {
    "enabled": true,
    "fields": {
      "name": true,
      "email": true,
      "phone": true,
      "message": true
    }
  },
  "theme": {
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "fontFamily": "Inter"
  }
}'::jsonb
where true; 