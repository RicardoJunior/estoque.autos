# Estoque.autos API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/signup

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "11999999999" // optional
}
```

**Validation Rules:**

- Email: valid email format
- Password: minimum 8 characters
- Name: minimum 2 characters
- Phone: optional

**Success Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "11999999999",
    "role": "owner",
    "is_active": true,
    "tenant_id": null
  },
  "needsOnboarding": true
}
```

**Error Response (400):**

```json
{
  "error": "Validation Error",
  "details": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### POST /auth/login

Authenticate and obtain access tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "v2.local.xxx...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "11999999999",
    "avatar_url": null,
    "role": "owner",
    "is_active": true
  },
  "tenant": {
    "id": "uuid",
    "name": "My Auto Store",
    "slug": "my-auto-store",
    "logo_url": null,
    "template_id": 1,
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "accent": "#10b981"
    },
    "phone": "11999999999",
    "whatsapp": "11999999999",
    "email": "store@example.com"
  },
  "needsOnboarding": false
}
```

**Error Response (401):**

```json
{
  "error": "Invalid credentials"
}
```

**Error Response (403):**

```json
{
  "error": "Account is deactivated"
}
```

---

### POST /auth/refresh

Refresh an expired access token.

**Request Body:**

```json
{
  "refreshToken": "v2.local.xxx..."
}
```

**Success Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "v2.local.xxx...",
  "expiresIn": 3600
}
```

**Error Response (401):**

```json
{
  "error": "Invalid refresh token"
}
```

---

### GET /auth/me

Get the current authenticated user's profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "11999999999",
    "avatar_url": null,
    "role": "owner",
    "is_active": true,
    "created_at": "2026-02-12T10:00:00.000Z"
  },
  "tenant": {
    "id": "uuid",
    "name": "My Auto Store",
    "slug": "my-auto-store",
    "cnpj": "12.345.678/0001-90",
    "address": "123 Main St",
    "phone": "11999999999",
    "whatsapp": "11999999999",
    "email": "store@example.com",
    "logo_url": null,
    "template_id": 1,
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "accent": "#10b981"
    },
    "settings": {},
    "created_at": "2026-02-12T10:00:00.000Z"
  },
  "needsOnboarding": false
}
```

**Error Response (401):**

```json
{
  "error": "Authentication required"
}
```

---

### POST /auth/onboarding/tenant

Create a tenant (store) during onboarding. Only available to users without a tenant.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "My Auto Store",
  "slug": "my-auto-store",
  "cnpj": "12.345.678/0001-90",
  "phone": "11999999999",
  "whatsapp": "11999999999",
  "email": "store@example.com"
}
```

**Validation Rules:**

- Name: minimum 2 characters
- Slug: minimum 3 characters, lowercase letters, numbers, and hyphens only (must be unique)
- CNPJ: optional
- Phone: required
- WhatsApp: optional (defaults to phone)
- Email: valid email format

**Success Response (201):**

```json
{
  "tenant": {
    "id": "uuid",
    "name": "My Auto Store",
    "slug": "my-auto-store",
    "cnpj": "12.345.678/0001-90",
    "phone": "11999999999",
    "whatsapp": "11999999999",
    "email": "store@example.com",
    "logo_url": null,
    "template_id": 1,
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "accent": "#10b981"
    },
    "settings": {},
    "created_at": "2026-02-12T10:00:00.000Z"
  },
  "message": "Tenant created successfully"
}
```

**Error Response (400):**

```json
{
  "error": "This slug is already taken"
}
```

**Error Response (400):**

```json
{
  "error": "User already has a tenant"
}
```

**Error Response (403):**

```json
{
  "error": "Only owners can create tenants"
}
```

---

### POST /auth/logout

Logout the current user. Note: This endpoint is mainly for logging purposes. Actual session invalidation happens client-side by removing tokens.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## User Roles

The system has three user roles with different permissions:

### Owner

- Full access to all features
- Can create and manage the tenant
- Can manage all users, vehicles, leads, and sales
- Access to financial data

### Manager

- Can manage users (except owners)
- Can manage vehicles, leads, and sales
- No access to sensitive financial data (costs, margins)
- Cannot delete the tenant

### Seller

- Can view and manage only their assigned leads
- Read-only access to vehicle inventory
- Can view their own sales and commissions
- No access to other users' data
- No access to financial data

---

## Error Responses

All error responses follow this format:

**Validation Error (400):**

```json
{
  "error": "Validation Error",
  "details": [
    {
      "path": "field_name",
      "message": "Error description"
    }
  ]
}
```

**Authentication Error (401):**

```json
{
  "error": "Missing or invalid authorization header"
}
```

**Authorization Error (403):**

```json
{
  "error": "Insufficient permissions"
}
```

**Not Found (404):**

```json
{
  "error": "Resource not found"
}
```

**Rate Limit (429):**

```json
{
  "error": "Too many requests, please try again later"
}
```

**Server Error (500):**

```json
{
  "error": "Internal Server Error",
  "details": "Error description (only in development mode)"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API routes**: 100 requests per 15 minutes per IP
- **Authentication routes**: 5 requests per 15 minutes per IP
- **Public routes** (leads): 10 requests per 15 minutes per IP

When rate limit is exceeded, the API returns a 429 status code.

---

## Multi-Tenancy

The system uses multi-tenant architecture where each store (tenant) has isolated data:

- All data is automatically filtered by `tenant_id` using Row Level Security (RLS)
- Users can only access data from their own tenant
- Tenant isolation is enforced at the database level
- The `tenant_id` is extracted from the authenticated user's JWT token

---

## Authentication Flow

### First-Time User

1. **Signup**: `POST /auth/signup`
   - User creates an account with email and password
   - Receives `owner` role automatically
   - Response includes `needsOnboarding: true`

2. **Login**: `POST /auth/login`
   - User logs in with credentials
   - Receives access token and refresh token
   - Response includes `needsOnboarding: true` (no tenant yet)

3. **Create Tenant**: `POST /auth/onboarding/tenant`
   - User creates their store (tenant)
   - Provides store name, slug, contact info
   - User is linked to the tenant

4. **Access App**: Protected routes now accessible
   - `GET /auth/me` returns full user and tenant data
   - `needsOnboarding: false`

### Returning User

1. **Login**: `POST /auth/login`
   - User logs in with credentials
   - Receives access token and refresh token
   - Response includes full user and tenant data

2. **Refresh Token**: `POST /auth/refresh` (when access token expires)
   - Send refresh token
   - Receive new access token and refresh token

3. **Logout**: `POST /auth/logout`
   - Client clears stored tokens
   - User is logged out

---

## Next Endpoints (Coming Soon)

- **Vehicles**: CRUD operations for vehicle inventory
- **Leads**: Capture and manage leads
- **Sales**: Record and track sales
- **Users**: Invite and manage team members (sellers, managers)
- **Public**: Public landing page and vehicle details
- **Marketplace**: Integration with automotive marketplaces
