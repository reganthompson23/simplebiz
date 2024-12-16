# SimpleBiz URL Implementation Plan

## Current Setup
- Using `https://simplebizsites.netlify.app/sites/[subdomain]`
- Subdomain generated from business name

## Phase 1: Path-Based URLs
When we acquire `simplebiz.site`:
1. Update base URL in code
2. Change URL structure to `simplebiz.site/[business-name]`
3. Update React Router configuration
4. No special DNS or infrastructure needed

## Phase 2: Custom Domain Service
Offer customers option to purchase custom domain setup for $100:

### Manual Process Per Customer
1. **Domain Purchase**
   - Purchase desired domain through GoDaddy
   - e.g., www.theirbusiness.com.au

2. **Netlify Configuration**
   - Add custom domain in Netlify dashboard
   - Get DNS records from Netlify

3. **DNS Setup in GoDaddy**
   - Add Netlify's DNS records
   - Typically includes:
     * A record for root domain
     * CNAME record for www subdomain
   - Wait for DNS propagation

### Benefits
- Clean, professional URLs
- Full domain masking
- Proper SSL certificates
- Good for SEO
- No visible connection to SimpleBiz platform

### Future Scaling Options
1. Document process for VAs
2. Potential automation using:
   - GoDaddy API
   - Netlify API
   - Custom dashboard for domain management

## Technical Notes
- No subdomain infrastructure needed
- Uses Netlify's built-in domain management
- SSL handled automatically by Netlify
- Path-based routing simplifies implementation
- Custom domains can point to path-based URLs without issues 