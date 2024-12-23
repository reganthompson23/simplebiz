# Lead Form Implementation Plan

## Current Infrastructure

### Supabase Table Structure
- `leads` table:
  - `id` (UUID)
  - `profile_id` (UUID) - links to business owner
  - `name` (text)
  - `email` (text)
  - `phone` (text)
  - `status` (text, default: 'new')
  - `notes` (text)
  - `source` (text)
  - `created_at` and `updated_at` timestamps

### Existing Frontend Components
- Website builder with lead form configuration
- Lead form UI in `WebsitePreview`
- `LeadsList` component for viewing leads

## Implementation Plan

### 1. Form Submission API
- Create new Supabase endpoint for form submissions
- Validate incoming form data
- Create new lead record
- Associate with correct business owner via profile_id
- Handle error cases and validation

### 2. Update WebsitePreview Component
- Make form inputs functional (remove disabled state)
- Add form submission handling
- Add loading states during submission
- Add error handling for failed submissions
- Show success message after submission
- Clear form after successful submission

### 3. Real-time Updates
- Implement real-time updates in LeadsList
- Use Supabase subscriptions to listen for new leads
- Update UI immediately when new leads arrive
- Add notification/badge for new unread leads

### 4. Optional Enhancements
- Email notifications for new leads
- SMS notifications (future consideration)
- Lead status management (new, contacted, converted, etc.)
- Lead notes and follow-up tracking

## Technical Considerations
- Form validation on both client and server side
- Rate limiting for form submissions
- Spam prevention
- Data sanitization
- Error handling and user feedback
- Mobile responsiveness of forms

## Security Considerations
- Validate business owner permissions
- Protect against spam submissions
- Sanitize all input data
- Secure storage of contact information 