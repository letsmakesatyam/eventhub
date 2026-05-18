#!/bin/bash
# EventHub API Test Examples
# Run these with a running backend: npm run dev
# Or replace http://localhost:5000 with your deployed URL

BASE="http://localhost:5000"
echo "=== EventHub API Tests ==="
echo ""

# ── HEALTH CHECK ─────────────────────────────────────────────
echo "--- Health Check ---"
curl -s "$BASE/health" | python3 -m json.tool
echo ""

# ── AUTH: REGISTER ───────────────────────────────────────────
echo "--- Register User ---"
REGISTER_RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@eventhub.com","password":"Test@123"}')
echo $REGISTER_RESP | python3 -m json.tool
TOKEN=$(echo $REGISTER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "Token: $TOKEN"
echo ""

# ── AUTH: LOGIN ──────────────────────────────────────────────
echo "--- Login ---"
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@eventhub.com","password":"Test@123"}')
echo $LOGIN_RESP | python3 -m json.tool
TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo ""

# ── AUTH: GET ME ─────────────────────────────────────────────
echo "--- Get Current User ---"
curl -s "$BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# ── EVENTS: LIST ─────────────────────────────────────────────
echo "--- List Events ---"
curl -s "$BASE/api/events" | python3 -m json.tool
echo ""

# ── EVENTS: CREATE (requires admin token) ────────────────────
echo "--- Create Event (Admin) ---"
# First login as admin and get ADMIN_TOKEN, then:
# ADMIN_TOKEN="your_admin_jwt_token"
# curl -s -X POST "$BASE/api/events" \
#   -H "Authorization: Bearer $ADMIN_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "title": "Tech Summit 2025",
#     "description": "Annual tech conference",
#     "event_date": "2025-08-15T09:00:00+05:30",
#     "location": "Mumbai",
#     "venue": "Bombay Exhibition Centre",
#     "capacity": 500,
#     "price": 999,
#     "category": "Technology",
#     "status": "published"
#   }' | python3 -m json.tool
echo "(Skipped - requires admin token)"
echo ""

# ── PAYMENTS: CREATE ORDER ───────────────────────────────────
echo "--- Create Payment Order ---"
# Replace EVENT_ID with a real event UUID
# curl -s -X POST "$BASE/api/payments/create-order" \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"event_id":"YOUR_EVENT_UUID"}' | python3 -m json.tool
echo "(Skipped - requires valid event ID)"
echo ""

# ── EDGE CASE: DUPLICATE REGISTRATION ───────────────────────
echo "--- Edge Case: Duplicate Registration ---"
# After registering once, trying again should return 409
# curl -s -X POST "$BASE/api/payments/register-free" \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"event_id":"FREE_EVENT_UUID"}' | python3 -m json.tool
echo "(Skipped - try after first registration)"
echo ""

# ── EDGE CASE: INVALID PAYMENT SIGNATURE ────────────────────
echo "--- Edge Case: Invalid Payment Signature ---"
VERIFY_RESP=$(curl -s -X POST "$BASE/api/payments/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_fake123",
    "razorpay_payment_id": "pay_fake456",
    "razorpay_signature": "invalidsignature",
    "registration_id": "fake-reg-id"
  }')
echo $VERIFY_RESP | python3 -m json.tool
echo ""

# ── TICKETS: MY TICKETS ──────────────────────────────────────
echo "--- My Tickets ---"
curl -s "$BASE/api/tickets/my" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# ── EDGE CASE: INVALID QR SCAN ───────────────────────────────
echo "--- Edge Case: Invalid QR Data ---"
# curl -s -X POST "$BASE/api/tickets/validate" \
#   -H "Authorization: Bearer $ADMIN_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"qr_data":"not-valid-json"}' | python3 -m json.tool
echo "(Skipped - requires admin token)"
echo ""

# ── ADMIN: DASHBOARD ─────────────────────────────────────────
echo "--- Admin Dashboard (requires admin token) ---"
# curl -s "$BASE/api/admin/dashboard" \
#   -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo "(Skipped - requires admin token)"
echo ""

echo "=== Tests Complete ==="
echo ""
echo "To promote a user to admin, run in Supabase SQL Editor:"
echo "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
