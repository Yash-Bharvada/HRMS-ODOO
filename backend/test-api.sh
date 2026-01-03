#!/bin/bash

echo "🧪 Testing Dayflow HRMS Backend API"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" $headers)
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json" $headers -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -c 4)
    
    if [ $? -eq 0 ] && [ ! -z "$response" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣  Authentication Tests"
echo "------------------------"

# Login as Admin
echo -n "Logging in as admin... "
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/authentication/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dayflow.com","password":"password123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    AUTH_HEADER="-H \"Authorization: Bearer $ACCESS_TOKEN\""
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    echo "Could not get access token. Exiting."
    exit 1
fi

echo ""
echo "2️⃣  User Management Tests"
echo "-------------------------"

# Get all users (Admin only)
echo -n "Get all users... "
USERS=$(curl -s -X GET "$BASE_URL/users" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$USERS" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "3️⃣  Employee Profile Tests"
echo "---------------------------"

# Get my profile
echo -n "Get my employee profile... "
PROFILE=$(curl -s -X GET "$BASE_URL/employees/me" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$PROFILE" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Get all employees
echo -n "Get all employees... "
EMPLOYEES=$(curl -s -X GET "$BASE_URL/employees" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$EMPLOYEES" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "4️⃣  Attendance Tests"
echo "--------------------"

# Get today's attendance
echo -n "Get today's attendance... "
ATTENDANCE=$(curl -s -X GET "$BASE_URL/attendance/today" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$ATTENDANCE" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Get attendance history
echo -n "Get attendance history... "
HISTORY=$(curl -s -X GET "$BASE_URL/attendance/history" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$HISTORY" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "5️⃣  Leave Management Tests"
echo "--------------------------"

# Get my leave requests
echo -n "Get my leave requests... "
MY_LEAVES=$(curl -s -X GET "$BASE_URL/leave/my-requests" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$MY_LEAVES" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Get pending leaves (Admin)
echo -n "Get pending leave requests... "
PENDING_LEAVES=$(curl -s -X GET "$BASE_URL/leave/pending" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$PENDING_LEAVES" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "6️⃣  Payroll Tests"
echo "-----------------"

# Get my payroll
echo -n "Get my payroll... "
MY_PAYROLL=$(curl -s -X GET "$BASE_URL/payroll/me" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$MY_PAYROLL" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Get all employees payroll (Admin)
echo -n "Get all employees payroll... "
ALL_PAYROLL=$(curl -s -X GET "$BASE_URL/payroll" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$ALL_PAYROLL" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "7️⃣  Dashboard Tests"
echo "-------------------"

# Get dashboard summary
echo -n "Get dashboard summary... "
SUMMARY=$(curl -s -X GET "$BASE_URL/dashboard/summary" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$SUMMARY" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Get dashboard statistics
echo -n "Get dashboard statistics... "
STATS=$(curl -s -X GET "$BASE_URL/dashboard/statistics" -H "Authorization: Bearer $ACCESS_TOKEN")
if [ ! -z "$STATS" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "====================================="
echo "📊 Test Results"
echo "====================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
