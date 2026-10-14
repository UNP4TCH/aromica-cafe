-- ============================================================================
-- Seed Data: supabase/seed.sql
-- Populates the isolated Aromica Café demo tenant & secondary test tenant
-- ============================================================================

-- Clean existing seed data
DELETE FROM tenants WHERE id IN (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000002'::uuid
);

-- ----------------------------------------------------------------------------
-- 1. Aromica Café (Primary Demo Tenant)
-- ----------------------------------------------------------------------------
INSERT INTO tenants (id, slug, name, is_demo, is_published)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'aromica-cafe',
    'Aromica Café',
    true,
    true
);

-- ----------------------------------------------------------------------------
-- 2. Bistro Verona (Secondary Private Tenant for Isolation Testing)
-- ----------------------------------------------------------------------------
INSERT INTO tenants (id, slug, name, is_demo, is_published)
VALUES (
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'bistro-verona',
    'Bistro Verona',
    false,
    false -- Unpublished tenant
);

-- ----------------------------------------------------------------------------
-- 3. Business Profile for Aromica Café
-- ----------------------------------------------------------------------------
INSERT INTO business_profiles (
    tenant_id,
    brand_word1,
    brand_word2,
    tagline,
    slogan,
    description,
    neighborhood,
    city,
    address,
    landmarks,
    landmark_guidance,
    visit_description,
    phone,
    whatsapp,
    instagram,
    reviews,
    order_online,
    menu_flipbook,
    directions,
    coordinates,
    hero_image,
    atmosphere,
    menu_meta
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Aromica',
    'Café',
    'Coffee • Chai • Comfort',
    'Good Food, Good Mood',
    'A warm neighborhood café for unhurried cups of coffee, steaming kullad chai, and freshly prepared comfort food near Boral High School.',
    'Near Boral High School',
    'Kolkata',
    '{
        "street": "Rajnarayan Park, C/9, Boral Main Road, near Boral High School",
        "locality": "Usha Pally, Kamdahari",
        "cityRegion": "Kolkata, Rajpur Sonarpur",
        "statePostal": "West Bengal 700154",
        "full": "AROMICA CAFE, Rajnarayan park, C/9, Boral Main Road, near Boral high school, Usha Pally, Kamdahari, Kolkata, Rajpur Sonarpur, West Bengal 700154"
    }'::jsonb,
    '["Near Boral High School", "Rajnarayan Park, C/9", "Boral Main Road"]'::jsonb,
    'Travel along Boral Main Road toward Usha Pally and Kamdahari. Look for Rajnarayan Park near Boral High School; the café is at premises C/9.',
    'Conveniently situated on Boral Main Road near Boral High School. Drop by for a relaxed evening cup, comfort snacks, or takeaways.',
    '{"enabled": true, "display": "+91 ••••• •••••", "raw": "", "href": "#"}'::jsonb,
    '{"enabled": true, "display": "+91 ••••• •••••", "raw": "", "href": "#"}'::jsonb,
    '{"enabled": true, "handle": "@aromica_cafe_", "href": "https://www.instagram.com/aromica_cafe_/"}'::jsonb,
    '{"enabled": true, "href": "https://www.google.com/maps/search/?api=1&query=AROMICA+CAFE+Boral+Main+Road+Kolkata"}'::jsonb,
    '{"enabled": true, "label": "Order Online", "href": "https://order.khide.in/191242969"}'::jsonb,
    '{"enabled": true, "label": "Flipbook Menu", "href": "https://go.fliplink.me/view/89104736-B13B-4B7A-936A-A6440716531F"}'::jsonb,
    '{"enabled": true, "href": "https://www.google.com/maps/dir//AROMICA+CAFE,+Rajnarayan+park,+C%2F9,+Boral+Main+Road,+near+Boral+high+school,+Usha+Pally,+Kamdahari,+Kolkata,+Rajpur+Sonarpur,+West+Bengal+700154/@22.4724502,88.3706634,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a027117fdf49f9d:0x8c5e094bd0449ba!2m2!1d88.3758395!2d22.4543465?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D", "embedSrc": "https://maps.google.com/maps?q=22.4543465,88.3758395&z=16&output=embed"}'::jsonb,
    '{"lat": 22.4543465, "lng": 88.3758395}'::jsonb,
    '{"src": "/images/aromica-exterior-drinks-01.webp", "alt": "AROMICA Café storefront at night with illuminated signage and two chilled drinks held in a toast"}'::jsonb,
    '{
        "eyebrow": "Coffee · Chai · Comfort",
        "title": "Good Food, Good Mood",
        "description": "A warm neighborhood corner near Boral High School for unhurried evenings, quiet conversations, and freshly prepared comfort food.",
        "image": {
            "src": "/images/aromica-interior-01.webp",
            "alt": "Interior wall with painted green arches, framed artwork, and woven pendant lamps inside Aromica Café",
            "badge": "Inside Aromica · Boral"
        }
    }'::jsonb,
    '{
        "title": "The Menu",
        "eyebrow": "Fresh Taste · Friendly Prices",
        "subtitle": "Prepared for evening cravings—from a quick kullad chai to full comfort meals.",
        "footerNote": "Prices are inclusive of taxes. Customizations such as extra cheese, paneer or chicken are available on request."
    }'::jsonb
);

-- ----------------------------------------------------------------------------
-- 4. Operating Schedule for Aromica Café
-- ----------------------------------------------------------------------------
INSERT INTO operating_schedules (tenant_id, day, day_index, hours, is_closed, open_minutes, close_minutes, open_display, close_display)
VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Monday', 1, 'Closed', true, NULL, NULL, NULL, NULL),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Tuesday', 2, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Wednesday', 3, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Thursday', 4, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Friday', 5, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Saturday', 6, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM'),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'Sunday', 0, '5:00 PM – 10:30 PM', false, 1020, 1350, '5:00 PM', '10:30 PM');

-- ----------------------------------------------------------------------------
-- 5. Menu Categories for Aromica Café
-- ----------------------------------------------------------------------------
INSERT INTO menu_categories (id, tenant_id, slug_id, label, display_order, is_published)
VALUES
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'beverages', 'Coffee & Beverages', 1, true),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'momos', 'Momos', 2, true);

-- Category for Bistro Verona (Private tenant)
INSERT INTO menu_categories (id, tenant_id, slug_id, label, display_order, is_published)
VALUES
    ('c0000000-0000-0000-0000-000000000099'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'pasta', 'Artisan Pasta', 1, true);

-- ----------------------------------------------------------------------------
-- 6. Menu Groups for Aromica Café
-- ----------------------------------------------------------------------------
INSERT INTO menu_groups (id, tenant_id, category_id, title, note, display_order)
VALUES
    ('g0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Hot Coffee', NULL, 1),
    ('g0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Cold Coffee & Shakes', 'Add a scoop of ice cream for ₹29', 2),
    ('g0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Momos (6 pcs)', NULL, 1);

-- Group for Bistro Verona
INSERT INTO menu_groups (id, tenant_id, category_id, title, note, display_order)
VALUES
    ('g0000000-0000-0000-0000-000000000099'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000099'::uuid, 'Handmade Ravioli', NULL, 1);

-- ----------------------------------------------------------------------------
-- 7. Menu Items for Aromica Café
-- ----------------------------------------------------------------------------
INSERT INTO menu_items (id, tenant_id, group_id, name, price, veg, description, available, display_order)
VALUES
    ('m0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'g0000000-0000-0000-0000-000000000001'::uuid, 'Black Coffee', '35', true, NULL, true, 1),
    ('m0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'g0000000-0000-0000-0000-000000000001'::uuid, 'Milk Coffee', '35 / 55', true, NULL, true, 2),
    ('m0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'g0000000-0000-0000-0000-000000000001'::uuid, 'Cappuccino', '89', true, NULL, true, 3),
    ('m0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'g0000000-0000-0000-0000-000000000002'::uuid, 'Classic Cold Coffee', '109', true, NULL, true, 1),
    ('m0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'g0000000-0000-0000-0000-000000000003'::uuid, 'Veg Momo', '79', true, NULL, true, 1),
    ('m0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'g0000000-0000-0000-0000-000000000003'::uuid, 'Chicken Momo', '99', false, NULL, true, 2),
    ('m0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'g0000000-0000-0000-0000-000000000003'::uuid, 'Gandharaj Momo', '129', false, 'Kolkata fragrant gondhoraj lime twist', true, 3);

-- Menu item for Bistro Verona (Private)
INSERT INTO menu_items (id, tenant_id, group_id, name, price, veg, description, available, display_order)
VALUES
    ('m0000000-0000-0000-0000-000000000099'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'g0000000-0000-0000-0000-000000000099'::uuid, 'Truffle Porcini Ravioli', '480', true, 'Handmade pasta with black truffle cream', true, 1);
