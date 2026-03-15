#!/bin/bash

# Consumer Lending API - cURL Examples
# 
# This script demonstrates how to use the Consumer Lending API with cURL commands.
# Make sure to set your access token and API URL before running.

# Configuration
API_URL="${API_URL:-http://localhost:3002}"
ACCESS_TOKEN="${ACCESS_TOKEN:-your_access_token_here}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Helper function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Helper function to print info messages
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if required variables are set
check_config() {
    if [ "$ACCESS_TOKEN" = "your_access_token_here" ]; then
        print_error "Please set your ACCESS_TOKEN environment variable"
        echo "Example: export ACCESS_TOKEN=your_actual_token"
        exit 1
    fi
    
    print_info "API URL: $API_URL"
    print_info "Token: ${ACCESS_TOKEN:0:20}..."
}

# Example 1: Health Check
health_check() {
    print_header "Health Check"
    
    echo "Basic health check:"
    curl -s -X GET "$API_URL/api/health" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
    
    echo -e "\nDetailed health check (admin required):"
    curl -s -X GET "$API_URL/api/health/detailed" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 2: Get Current User Profile
get_current_user() {
    print_header "Get Current User Profile"
    
    curl -s -X GET "$API_URL/api/users/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 3: Get User by ID
get_user_by_id() {
    local user_id="${1:-user123}"
    print_header "Get User by ID: $user_id"
    
    curl -s -X GET "$API_URL/api/users/$user_id" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 4: List All Users (Admin)
list_users() {
    print_header "List All Users (Admin Required)"
    
    echo "List first 10 users:"
    curl -s -X GET "$API_URL/api/users?limit=10" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
    
    echo -e "\nSearch for users named 'john':"
    curl -s -X GET "$API_URL/api/users?search=john&limit=5" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 5: Get Credit Score
get_credit_score() {
    local user_id="${1:-user123}"
    print_header "Get Credit Score for User: $user_id"
    
    curl -s -X GET "$API_URL/api/credit/$user_id/score" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 6: Get Credit Limit
get_credit_limit() {
    local user_id="${1:-user123}"
    print_header "Get Credit Limit for User: $user_id"
    
    curl -s -X GET "$API_URL/api/credit/$user_id/limit" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 7: Get Full Credit Assessment
get_credit_assessment() {
    local user_id="${1:-user123}"
    print_header "Get Full Credit Assessment for User: $user_id"
    
    curl -s -X GET "$API_URL/api/credit/$user_id/assessment" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 8: Admin Dashboard
get_admin_dashboard() {
    print_header "Admin Dashboard (Admin Required)"
    
    curl -s -X GET "$API_URL/api/admin/dashboard" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 9: Recalculate Credit Scores (Admin)
recalculate_credit_scores() {
    print_header "Recalculate Credit Scores (Admin Required)"
    
    echo "Recalculating credit scores for users: user123, user456"
    curl -s -X POST "$API_URL/api/admin/credit/recalculate" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "userIds": ["user123", "user456"],
            "force": true
        }' | jq '.'
}

# Example 10: Get Credit Reports (Admin)
get_credit_reports() {
    print_header "Get Credit Reports (Admin Required)"
    
    local start_date="${1:-2024-01-01}"
    local end_date="${2:-2024-01-31}"
    
    echo "Getting credit reports from $start_date to $end_date:"
    curl -s -X GET "$API_URL/api/admin/credit/reports?startDate=${start_date}T00:00:00Z&endDate=${end_date}T23:59:59Z" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 11: Error Handling Examples
error_handling_examples() {
    print_header "Error Handling Examples"
    
    echo "1. Invalid user ID (should return 404):"
    curl -s -X GET "$API_URL/api/users/nonexistent" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq '.'
    
    echo -e "\n2. Invalid token (should return 401):"
    curl -s -X GET "$API_URL/api/users/me" \
        -H "Authorization: Bearer invalid_token" \
        -H "Content-Type: application/json" | jq '.'
    
    echo -e "\n3. Missing authorization header (should return 401):"
    curl -s -X GET "$API_URL/api/users/me" \
        -H "Content-Type: application/json" | jq '.'
}

# Example 12: Rate Limiting Test
rate_limiting_test() {
    print_header "Rate Limiting Test"
    
    echo "Making 5 rapid requests to test rate limiting:"
    for i in {1..5}; do
        echo "Request $i:"
        curl -s -X GET "$API_URL/api/health" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -w "Status: %{http_code}, Time: %{time_total}s\n" \
            -o /dev/null
        sleep 0.1
    done
}

# Example 13: Batch Operations
batch_operations() {
    print_header "Batch Operations Example"
    
    local user_ids=("user123" "user456" "user789")
    
    echo "Getting credit assessments for multiple users:"
    for user_id in "${user_ids[@]}"; do
        echo -e "\n--- User: $user_id ---"
        curl -s -X GET "$API_URL/api/credit/$user_id/assessment" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" | jq '.data | {userId, creditScore: .creditScore.score, creditLimit: .creditLimit.calculatedLimit}'
    done
}

# Example 14: Performance Testing
performance_test() {
    print_header "Performance Testing"
    
    echo "Testing response times for different endpoints:"
    
    endpoints=(
        "/api/health"
        "/api/users/me"
        "/api/credit/user123/score"
        "/api/credit/user123/limit"
        "/api/credit/user123/assessment"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -e "\nTesting: $endpoint"
        curl -s -X GET "$API_URL$endpoint" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -w "Response Time: %{time_total}s, Size: %{size_download} bytes\n" \
            -o /dev/null
    done
}

# Example 15: Data Validation Examples
data_validation_examples() {
    print_header "Data Validation Examples"
    
    echo "1. Invalid request body for credit recalculation:"
    curl -s -X POST "$API_URL/api/admin/credit/recalculate" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "invalidField": "invalid_value"
        }' | jq '.'
    
    echo -e "\n2. Empty user IDs array:"
    curl -s -X POST "$API_URL/api/admin/credit/recalculate" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "userIds": [],
            "force": false
        }' | jq '.'
}

# Main execution function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    Consumer Lending API - cURL Examples"
    echo "=================================================="
    echo -e "${NC}"
    
    # Check configuration
    check_config
    
    # Run examples based on command line arguments
    case "${1:-all}" in
        "health")
            health_check
            ;;
        "user")
            get_current_user
            get_user_by_id "${2:-user123}"
            ;;
        "users")
            list_users
            ;;
        "credit")
            local user_id="${2:-user123}"
            get_credit_score "$user_id"
            get_credit_limit "$user_id"
            get_credit_assessment "$user_id"
            ;;
        "admin")
            get_admin_dashboard
            recalculate_credit_scores
            get_credit_reports
            ;;
        "errors")
            error_handling_examples
            ;;
        "performance")
            performance_test
            rate_limiting_test
            ;;
        "batch")
            batch_operations
            ;;
        "validation")
            data_validation_examples
            ;;
        "all")
            health_check
            get_current_user
            get_user_by_id "user123"
            get_credit_score "user123"
            get_credit_limit "user123"
            get_credit_assessment "user123"
            list_users
            batch_operations
            ;;
        *)
            echo "Usage: $0 [health|user|users|credit|admin|errors|performance|batch|validation|all] [user_id]"
            echo ""
            echo "Examples:"
            echo "  $0 health                    # Run health checks"
            echo "  $0 user user123             # Get user profile"
            echo "  $0 credit user456           # Get credit info for user"
            echo "  $0 admin                    # Run admin examples"
            echo "  $0 all                      # Run all basic examples"
            exit 1
            ;;
    esac
    
    print_success "Examples completed successfully!"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required for JSON formatting. Please install it:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  CentOS/RHEL: sudo yum install jq"
    exit 1
fi

# Run main function with all arguments
main "$@"