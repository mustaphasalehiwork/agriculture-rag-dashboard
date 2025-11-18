#!/bin/bash

echo "=== Applying Dashboard Router Fix ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
fi

echo "1. Stopping current services..."
docker-compose -f docker-compose.simple.yml down
echo ""

echo "2. Starting services with corrected router configuration..."
docker-compose -f docker-compose.simple.yml up -d
echo ""

echo "3. Waiting for services to start..."
sleep 30
echo ""

echo "4. Checking container status..."
docker-compose -f docker-compose.simple.yml ps
echo ""

echo "5. Testing local access..."
echo "Dashboard on port 3000:"
curl -I http://localhost:3000 2>/dev/null | head -2
echo ""

echo "6. Checking updated Traefik routers..."
echo "Available routers now:"
curl -s http://localhost:8080/api/http/routers | grep -o '"name":"[^"]*"' | sort
echo ""

echo "7. Checking dashboard router specifically..."
echo "Dashboard router configuration:"
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("dashboard")) | {name: .name, rule: .rule, service: .service, entryPoints: .entryPoints, status: .status}' 2>/dev/null || echo "Could not fetch dashboard router info"
echo ""

echo "8. Testing HTTPS access..."
echo "Testing dashboard HTTPS:"
curl -I https://dashboard.srv1061858.hstgr.cloud 2>/dev/null | head -5
echo ""

echo "9. Testing with curl verbose output..."
echo "Full HTTPS test:"
timeout 10 curl -v https://dashboard.srv1061858.hstgr.cloud 2>&1 | grep -E "(HTTP|< |> |Location)" | head -10
echo ""

echo "10. If still getting 404, let's test specific paths..."
echo "Testing /login path:"
timeout 10 curl -I https://dashboard.srv1061858.hstgr.cloud/login 2>/dev/null | head -3
echo ""

echo "=== Expected Results ==="
echo "✅ Should see 'dashboard@docker' in the router list"
echo "✅ Should see 'Host(\`dashboard.srv1061858.hstgr.cloud\`)' in router rule"
echo "✅ Should get 200/307 response from HTTPS"
echo ""
echo "If still seeing 404:"
echo "1. Check browser developer tools for the actual URL being requested"
echo "2. Verify if there are JavaScript errors on the page"
echo "3. Try accessing: https://dashboard.srv1061858.hstgr.cloud/login"