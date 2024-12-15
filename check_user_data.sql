-- Check all profiles and websites
select 
  p.id as profile_id,
  p.business_name,
  p.contact_email,
  w.id as website_id,
  w.subdomain,
  w.content,
  w.published
from profiles p
left join websites w on w.profile_id = p.id; 