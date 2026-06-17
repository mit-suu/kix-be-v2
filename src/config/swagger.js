const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "KIX Sneaker Shop API",
            version: "1.0.0",
            description:
                "API documentation cho KIX Sneaker Shop - Hệ thống quản lý bán giày sneaker",
            contact: {
                name: "tuan-hiep",
            },
        },
        servers: [
            {
                url: "http://localhost:5000/api/v1",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Nhập access token (không cần prefix Bearer)",
                },
            },
            schemas: {
                // ============ BASE ============
                BaseResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        data: { type: "object", nullable: true },
                        meta: { type: "object", nullable: true },
                        error: { nullable: true },
                    },
                },
                Pagination: {
                    type: "object",
                    properties: {
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 10 },
                        totalCount: { type: "integer", example: 100 },
                        totalPages: { type: "integer", example: 10 },
                    },
                },

                // ============ USER ============
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        email: { type: "string", format: "email" },
                        name: { type: "string", nullable: true },
                        avatar: { type: "string", nullable: true },
                        phone: { type: "string", nullable: true },
                        role: {
                            type: "string",
                            enum: ["admin", "store_manager", "customer"],
                        },
                        default_address: { $ref: "#/components/schemas/Address" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Address: {
                    type: "object",
                    properties: {
                        recipient_name: { type: "string", example: "Nguyễn Văn A" },
                        phone: { type: "string", example: "0912345678" },
                        address: {
                            type: "string",
                            example: "123 Nguyễn Huệ, Q1, TP.HCM",
                        },
                        ward: { type: "string", example: "Phường Bến Nghé" },
                        district: { type: "string", example: "Quận 1" },
                        city: { type: "string", example: "TP.HCM" },
                    },
                },

                // ============ PRODUCT ============
                Product: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string", example: "Air Jordan 1 Retro High OG" },
                        brand: { type: "string", example: "Nike" },
                        description: { type: "string" },
                        images: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    url: { type: "string" },
                                    is_primary: { type: "boolean" },
                                },
                            },
                        },
                        price: { type: "number", example: 4500000, minimum: 1000, description: "Giá sản phẩm (VND), tối thiểu 1000" },
                        status: { type: "string", enum: ["active", "inactive"] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                SKU: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        product_id: { type: "string" },
                        size: { type: "number", example: 42 },
                        color: { type: "string", example: "Black/Red" },
                        sku_code: { type: "string", example: "AJ1-BLK-RED-42" },
                    },
                },

                // ============ STORE ============
                Store: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string", example: "KIX Store Quận 1" },
                        address: {
                            type: "string",
                            example: "123 Nguyễn Huệ, Q1, TP.HCM",
                        },
                        phone: { type: "string", example: "0912345678" },
                        status: { type: "string", enum: ["active", "inactive"] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ============ CART ============
                CartItem: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        product_id: { type: "string" },
                        sku_id: { type: "string" },
                        store_id: { type: "string" },
                        quantity: { type: "integer", example: 1 },
                        price: { type: "number", example: 4500000 },
                        subtotal: { type: "number", example: 4500000 },
                    },
                },
                Cart: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        user_id: { type: "string" },
                        items: {
                            type: "array",
                            items: { $ref: "#/components/schemas/CartItem" },
                        },
                        total: { type: "number", example: 9000000 },
                        item_count: { type: "integer", example: 2 },
                    },
                },

                // ============ ORDER ============
                OrderItem: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        product_name: {
                            type: "string",
                            example: "Air Jordan 1 Retro High OG",
                        },
                        size: { type: "number", example: 42 },
                        color: { type: "string", example: "Black/Red" },
                        sku_code: { type: "string", example: "AJ1-BLK-RED-42" },
                        store_name: { type: "string", example: "KIX Store Quận 1" },
                        quantity: { type: "integer", example: 1 },
                        price: { type: "number", example: 4500000 },
                        subtotal: { type: "number", example: 4500000 },
                    },
                },
                Order: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        order_number: { type: "string", example: "KIX-M5X1A2-B3C4" },
                        customer_id: { type: "string" },
                        customer_email: { type: "string", format: "email" },
                        customer_phone: { type: "string" },
                        shipping_address: { $ref: "#/components/schemas/Address" },
                        items: {
                            type: "array",
                            items: { $ref: "#/components/schemas/OrderItem" },
                        },
                        total: { type: "number", example: 9000000 },
                        payment_method: { type: "string", example: "vnpay" },
                        payment_status: {
                            type: "string",
                            enum: ["pending", "success", "failed"],
                        },
                        status: {
                            type: "string",
                            enum: ["pending", "paid", "completed", "cancelled"],
                        },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                // ============ INVENTORY ============
                Inventory: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        store_id: { type: "string" },
                        sku_id: { type: "string" },
                        quantity: { type: "integer", example: 50 },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                InventoryHistory: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        store: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                            },
                        },
                        sku: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                size: { type: "number" },
                                color: { type: "string" },
                                sku_code: { type: "string" },
                                product: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        brand: { type: "string" },
                                    },
                                },
                            },
                        },
                        type: {
                            type: "string",
                            enum: ["SOLD", "RESTOCK", "ADJUSTMENT"],
                        },
                        quantity_change: { type: "integer" },
                        quantity_before: { type: "integer" },
                        quantity_after: { type: "integer" },
                        note: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },

        // ============================================
        // ============== PATHS ======================
        // ============================================
        paths: {
            // ==========================================
            //               AUTH
            // ==========================================
            "/auth/register": {
                post: {
                    tags: ["Auth"],
                    summary: "Đăng ký tài khoản",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "password"],
                                    properties: {
                                        email: {
                                            type: "string",
                                            format: "email",
                                            example: "user@example.com",
                                        },
                                        password: {
                                            type: "string",
                                            minLength: 6,
                                            example: "123456",
                                        },
                                        name: { type: "string", example: "Nguyễn Văn A" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Đăng ký thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/User" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        400: { description: "Validation failed" },
                        409: { description: "Email đã tồn tại" },
                    },
                },
            },
            "/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Đăng nhập",
                    description:
                        "Đăng nhập và nhận access token + refresh token (lưu trong httpOnly cookie)",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "password"],
                                    properties: {
                                        email: {
                                            type: "string",
                                            format: "email",
                                            example: "user@example.com",
                                        },
                                        password: { type: "string", example: "123456" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Đăng nhập thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "object",
                                                        properties: {
                                                            user: { $ref: "#/components/schemas/User" },
                                                            accessToken: { type: "string" },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        400: { description: "Validation failed" },
                        401: { description: "Email hoặc mật khẩu không đúng" },
                    },
                },
            },
            "/auth/refresh": {
                post: {
                    tags: ["Auth"],
                    summary: "Refresh access token",
                    description:
                        "Refresh token được đọc từ httpOnly cookie, trả về access token mới",
                    responses: {
                        200: {
                            description: "Token refreshed thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "object",
                                                        properties: {
                                                            accessToken: { type: "string" },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Refresh token not found" },
                        403: { description: "Invalid or expired refresh token" },
                    },
                },
            },
            "/auth/logout": {
                post: {
                    tags: ["Auth"],
                    summary: "Đăng xuất",
                    description: "Xóa refresh token cookie",
                    responses: {
                        200: { description: "Đăng xuất thành công" },
                    },
                },
            },

            // ==========================================
            //               USER
            // ==========================================
            "/users/profile": {
                get: {
                    tags: ["User"],
                    summary: "Lấy profile user hiện tại",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/User" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                    },
                },
                put: {
                    tags: ["User"],
                    summary: "Cập nhật profile",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", example: "Nguyễn Văn B" },
                                        phone: { type: "string", example: "0912345678" },
                                        avatar: {
                                            type: "string",
                                            format: "binary",
                                            description: "Upload ảnh avatar (tối đa 2MB)",
                                        },
                                        default_address: {
                                            type: "string",
                                            description: "JSON string của object Address",
                                            example: '{"recipient_name":"Nguyễn Văn A","phone":"0912345678","address":"123 Đường ABC","ward":"Phường 1","district":"Quận 1","city":"TP.HCM"}',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/users": {
                get: {
                    tags: ["User"],
                    summary: "Danh sách users (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 10 },
                        },
                        {
                            in: "query",
                            name: "role",
                            schema: {
                                type: "string",
                                enum: ["admin", "store_manager", "customer"],
                            },
                        },
                        {
                            in: "query",
                            name: "search",
                            schema: { type: "string" },
                            description: "Tìm theo email hoặc name",
                        },
                    ],
                    responses: {
                        200: { description: "Thành công" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden - Admin only" },
                    },
                },
            },
            "/users/{id}/role": {
                put: {
                    tags: ["User"],
                    summary: "Cập nhật role user (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                            description: "User ID",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["role"],
                                    properties: {
                                        role: {
                                            type: "string",
                                            enum: ["admin", "store_manager", "customer"],
                                            example: "store_manager",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        400: { description: "Invalid role" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },

            // ==========================================
            //              PRODUCT
            // ==========================================
            "/products": {
                get: {
                    tags: ["Product"],
                    summary: "Danh sách sản phẩm (Public)",
                    parameters: [
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 12 },
                        },
                        {
                            in: "query",
                            name: "brand",
                            schema: { type: "string" },
                            description: "Lọc theo brand",
                        },
                        {
                            in: "query",
                            name: "search",
                            schema: { type: "string" },
                            description: "Tìm theo name, brand, description",
                        },
                        {
                            in: "query",
                            name: "sort",
                            schema: { type: "string", default: "-createdAt" },
                            description: "Sort field (prefix - cho DESC). VD: -price, price, -createdAt",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: { $ref: "#/components/schemas/Product" },
                                                    },
                                                    meta: {
                                                        $ref: "#/components/schemas/Pagination",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Product"],
                    summary: "Tạo sản phẩm mới (Admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["name", "brand", "price"],
                                    properties: {
                                        name: {
                                            type: "string",
                                            example: "Air Jordan 1 Retro High OG",
                                        },
                                        brand: { type: "string", example: "Nike" },
                                        description: {
                                            type: "string",
                                            example: "Classic sneaker",
                                        },
                                        price: { type: "number", example: 4500000, minimum: 1000, description: "Giá sản phẩm (VND), tối thiểu 1000" },
                                        images: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                                format: "binary",
                                            },
                                            description: "Upload ảnh sản phẩm (tối đa 5 ảnh, mỗi ảnh tối đa 5MB)",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Tạo thành công" },
                        400: { description: "Validation failed" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/products/brands": {
                get: {
                    tags: ["Product"],
                    summary: "Danh sách brands (Public)",
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: { type: "string" },
                                                        example: ["Nike", "Adidas", "New Balance"],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/products/{id}": {
                get: {
                    tags: ["Product"],
                    summary: "Chi tiết sản phẩm + SKUs + availability (Public)",
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                            description: "Product ID",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "object",
                                                        properties: {
                                                            product: {
                                                                $ref: "#/components/schemas/Product",
                                                            },
                                                            skus: {
                                                                type: "array",
                                                                items: { $ref: "#/components/schemas/SKU" },
                                                            },
                                                            availability: {
                                                                type: "array",
                                                                items: {
                                                                    type: "object",
                                                                    properties: {
                                                                        store_id: { type: "string" },
                                                                        store_name: { type: "string" },
                                                                        store_address: { type: "string" },
                                                                        skus: {
                                                                            type: "array",
                                                                            items: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    sku_id: { type: "string" },
                                                                                    size: { type: "number" },
                                                                                    color: { type: "string" },
                                                                                    sku_code: { type: "string" },
                                                                                    quantity: { type: "integer" },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        404: { description: "Product not found" },
                    },
                },
                put: {
                    tags: ["Product"],
                    summary: "Cập nhật sản phẩm (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        brand: { type: "string" },
                                        description: { type: "string" },
                                        price: { type: "number", minimum: 1000, description: "Giá sản phẩm (VND), tối thiểu 1000" },
                                        images: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                                format: "binary",
                                            },
                                            description: "Upload ảnh sản phẩm (tối đa 5 ảnh)",
                                        },
                                        status: {
                                            type: "string",
                                            enum: ["active", "inactive"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        404: { description: "Product not found" },
                    },
                },
                delete: {
                    tags: ["Product"],
                    summary: "Xóa sản phẩm - soft delete (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: { description: "Xóa thành công" },
                        404: { description: "Product not found" },
                    },
                },
            },
            "/products/{id}/skus": {
                get: {
                    tags: ["Product"],
                    summary: "Danh sách SKU của sản phẩm (Public)",
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                            description: "Product ID",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: { $ref: "#/components/schemas/SKU" },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Product"],
                    summary: "Tạo SKU cho sản phẩm (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                            description: "Product ID",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["size", "color", "sku_code"],
                                    properties: {
                                        size: { type: "number", example: 42 },
                                        color: { type: "string", example: "Black/Red" },
                                        sku_code: { type: "string", example: "AJ1-BLK-RED-42" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Tạo SKU thành công" },
                        400: { description: "Validation failed" },
                        404: { description: "Product not found" },
                        409: { description: "SKU code đã tồn tại" },
                    },
                },
            },

            // ==========================================
            //               STORE
            // ==========================================
            "/stores": {
                get: {
                    tags: ["Store"],
                    summary: "Danh sách stores (Public)",
                    parameters: [
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 10 },
                        },
                        {
                            in: "query",
                            name: "search",
                            schema: { type: "string" },
                            description: "Tìm theo name hoặc address",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: { $ref: "#/components/schemas/Store" },
                                                    },
                                                    meta: {
                                                        $ref: "#/components/schemas/Pagination",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Store"],
                    summary: "Tạo store mới (Admin)",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["name", "address"],
                                    properties: {
                                        name: {
                                            type: "string",
                                            example: "KIX Store Quận 1",
                                        },
                                        address: {
                                            type: "string",
                                            example: "123 Nguyễn Huệ, Q1, TP.HCM",
                                        },
                                        phone: { type: "string", example: "0912345678" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Tạo thành công" },
                        400: { description: "Validation failed" },
                    },
                },
            },
            "/stores/{id}": {
                get: {
                    tags: ["Store"],
                    summary: "Chi tiết store (Public)",
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: { description: "Thành công" },
                        404: { description: "Store not found" },
                    },
                },
                put: {
                    tags: ["Store"],
                    summary: "Cập nhật store (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        address: { type: "string" },
                                        phone: { type: "string" },
                                        status: {
                                            type: "string",
                                            enum: ["active", "inactive"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        404: { description: "Store not found" },
                    },
                },
                delete: {
                    tags: ["Store"],
                    summary: "Xóa store - soft delete (Admin)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: { description: "Xóa thành công" },
                        404: { description: "Store not found" },
                    },
                },
            },

            // ==========================================
            //               CART
            // ==========================================
            "/cart": {
                get: {
                    tags: ["Cart"],
                    summary: "Lấy giỏ hàng",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/Cart" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                    },
                },
                delete: {
                    tags: ["Cart"],
                    summary: "Xóa toàn bộ giỏ hàng",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Xóa thành công" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/cart/items": {
                post: {
                    tags: ["Cart"],
                    summary: "Thêm sản phẩm vào giỏ",
                    description:
                        "Thêm sản phẩm vào giỏ hàng. Nếu cùng SKU + Store đã có → cộng dồn quantity. Tự động kiểm tra tồn kho.",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: [
                                        "product_id",
                                        "sku_id",
                                        "store_id",
                                        "quantity",
                                        "price",
                                    ],
                                    properties: {
                                        product_id: {
                                            type: "string",
                                            example: "665a1b2c3d4e5f6a7b8c9d0e",
                                        },
                                        sku_id: {
                                            type: "string",
                                            example: "665a1b2c3d4e5f6a7b8c9d1f",
                                        },
                                        store_id: {
                                            type: "string",
                                            example: "665a1b2c3d4e5f6a7b8c9d2a",
                                        },
                                        quantity: { type: "integer", minimum: 1, maximum: 10, example: 1 },
                                        price: { type: "number", example: 4500000, minimum: 1000, description: "Giá sản phẩm (VND), tối thiểu 1000" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Thêm thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/Cart" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        400: {
                            description:
                                "Validation failed / Product not found / Insufficient stock",
                        },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/cart/items/{itemId}": {
                put: {
                    tags: ["Cart"],
                    summary: "Cập nhật số lượng item",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "itemId",
                            required: true,
                            schema: { type: "string" },
                            description: "Cart item ID",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["quantity"],
                                    properties: {
                                        quantity: {
                                            type: "integer",
                                            minimum: 1,
                                            maximum: 10,
                                            example: 2,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        400: {
                            description: "Item not found / Insufficient stock",
                        },
                        401: { description: "Unauthorized" },
                    },
                },
                delete: {
                    tags: ["Cart"],
                    summary: "Xóa item khỏi giỏ",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "itemId",
                            required: true,
                            schema: { type: "string" },
                            description: "Cart item ID",
                        },
                    ],
                    responses: {
                        200: { description: "Xóa thành công" },
                        404: { description: "Item not found" },
                        401: { description: "Unauthorized" },
                    },
                },
            },

            // ==========================================
            //               ORDER
            // ==========================================
            "/orders/checkout": {
                post: {
                    tags: ["Order"],
                    summary: "Đặt hàng từ giỏ hàng (Checkout)",
                    description:
                        "Tạo đơn hàng từ toàn bộ giỏ hàng. Sử dụng MongoDB Transaction: validate tồn kho → trừ kho → tạo order → xóa cart. Rollback nếu có lỗi.",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["shipping_address"],
                                    properties: {
                                        shipping_address: {
                                            type: "object",
                                            required: ["recipient_name", "phone", "address"],
                                            properties: {
                                                recipient_name: {
                                                    type: "string",
                                                    example: "Nguyễn Văn A",
                                                },
                                                phone: { type: "string", example: "0912345678" },
                                                address: {
                                                    type: "string",
                                                    example:
                                                        "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                                                },
                                                ward: {
                                                    type: "string",
                                                    example: "Phường Bến Nghé",
                                                },
                                                district: { type: "string", example: "Quận 1" },
                                                city: { type: "string", example: "TP.HCM" },
                                            },
                                        },
                                        payment_method: {
                                            type: "string",
                                            default: "vnpay",
                                            example: "vnpay",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Đặt hàng thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/Order" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        400: {
                            description:
                                "Cart empty / Product not available / Insufficient stock",
                        },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/orders": {
                get: {
                    tags: ["Order"],
                    summary: "Danh sách đơn hàng của tôi",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 10 },
                        },
                        {
                            in: "query",
                            name: "status",
                            schema: {
                                type: "string",
                                enum: ["pending", "paid", "completed", "cancelled"],
                            },
                            description: "Lọc theo trạng thái",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: { $ref: "#/components/schemas/Order" },
                                                    },
                                                    meta: {
                                                        $ref: "#/components/schemas/Pagination",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/orders/admin/all": {
                get: {
                    tags: ["Order"],
                    summary: "Tất cả đơn hàng (Admin/Manager)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 10 },
                        },
                        {
                            in: "query",
                            name: "status",
                            schema: {
                                type: "string",
                                enum: ["pending", "paid", "completed", "cancelled"],
                            },
                        },
                        {
                            in: "query",
                            name: "search",
                            schema: { type: "string" },
                            description: "Tìm theo order_number hoặc email",
                        },
                    ],
                    responses: {
                        200: { description: "Thành công" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/orders/{id}": {
                get: {
                    tags: ["Order"],
                    summary: "Chi tiết đơn hàng",
                    description:
                        "Customer chỉ xem được đơn của mình. Admin/Manager xem tất cả.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                            description: "Order ID",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: { $ref: "#/components/schemas/Order" },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        404: { description: "Order not found" },
                    },
                },
            },
            "/orders/{id}/cancel": {
                put: {
                    tags: ["Order"],
                    summary: "Hủy đơn hàng (Customer)",
                    description:
                        "Chỉ hủy được đơn hàng có trạng thái pending. Tự động hoàn lại tồn kho.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        200: { description: "Hủy thành công" },
                        400: {
                            description: "Order not found / Can only cancel pending orders",
                        },
                    },
                },
            },
            "/orders/{id}/status": {
                put: {
                    tags: ["Order"],
                    summary: "Cập nhật trạng thái đơn hàng (Admin/Manager)",
                    description:
                        "Status transitions: pending → paid/cancelled, paid → completed/cancelled. Nếu cancelled → hoàn kho.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["status"],
                                    properties: {
                                        status: {
                                            type: "string",
                                            enum: ["paid", "completed", "cancelled"],
                                            example: "paid",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Cập nhật thành công" },
                        400: {
                            description: "Invalid status transition",
                        },
                        403: { description: "Forbidden" },
                    },
                },
            },

            // ==========================================
            //              INVENTORY
            // ==========================================
            "/inventory/store/{storeId}": {
                get: {
                    tags: ["Inventory"],
                    summary: "Tồn kho theo store (Admin/Manager)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "storeId",
                            required: true,
                            schema: { type: "string" },
                            description: "Store ID",
                        },
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 20 },
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                id: { type: "string" },
                                                                store_id: { type: "string" },
                                                                sku: {
                                                                    type: "object",
                                                                    properties: {
                                                                        id: { type: "string" },
                                                                        size: { type: "number" },
                                                                        color: { type: "string" },
                                                                        sku_code: { type: "string" },
                                                                        product: {
                                                                            type: "object",
                                                                            properties: {
                                                                                id: { type: "string" },
                                                                                name: { type: "string" },
                                                                                brand: { type: "string" },
                                                                                price: { type: "number" },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                quantity: { type: "integer" },
                                                                updatedAt: {
                                                                    type: "string",
                                                                    format: "date-time",
                                                                },
                                                            },
                                                        },
                                                    },
                                                    meta: {
                                                        $ref: "#/components/schemas/Pagination",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/inventory/sku/{skuId}": {
                get: {
                    tags: ["Inventory"],
                    summary: "Tồn kho theo SKU tại tất cả stores (Admin/Manager)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "skuId",
                            required: true,
                            schema: { type: "string" },
                            description: "SKU ID",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                id: { type: "string" },
                                                                store: { $ref: "#/components/schemas/Store" },
                                                                quantity: { type: "integer" },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },
            "/inventory/store/{storeId}/sku/{skuId}": {
                put: {
                    tags: ["Inventory"],
                    summary: "Cập nhật tồn kho (Restock/Adjust) (Admin/Manager)",
                    description:
                        "Cập nhật số lượng tồn kho cho 1 SKU tại 1 Store. Tự động ghi lịch sử thay đổi.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "storeId",
                            required: true,
                            schema: { type: "string" },
                            description: "Store ID",
                        },
                        {
                            in: "path",
                            name: "skuId",
                            required: true,
                            schema: { type: "string" },
                            description: "SKU ID",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["quantity"],
                                    properties: {
                                        quantity: {
                                            type: "integer",
                                            minimum: 0,
                                            example: 50,
                                        },
                                        note: {
                                            type: "string",
                                            example: "Nhập hàng từ nhà cung cấp",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Cập nhật thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        $ref: "#/components/schemas/Inventory",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        400: { description: "Validation failed" },
                        404: { description: "Store or SKU not found" },
                    },
                },
            },
            "/inventory/history": {
                get: {
                    tags: ["Inventory"],
                    summary: "Lịch sử thay đổi tồn kho (Admin/Manager)",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "query",
                            name: "store_id",
                            schema: { type: "string" },
                            description: "Lọc theo Store ID",
                        },
                        {
                            in: "query",
                            name: "sku_id",
                            schema: { type: "string" },
                            description: "Lọc theo SKU ID",
                        },
                        {
                            in: "query",
                            name: "page",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            in: "query",
                            name: "limit",
                            schema: { type: "integer", default: 20 },
                        },
                    ],
                    responses: {
                        200: {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        allOf: [
                                            { $ref: "#/components/schemas/BaseResponse" },
                                            {
                                                type: "object",
                                                properties: {
                                                    data: {
                                                        type: "array",
                                                        items: {
                                                            $ref: "#/components/schemas/InventoryHistory",
                                                        },
                                                    },
                                                    meta: {
                                                        $ref: "#/components/schemas/Pagination",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                    },
                },
            },
        },

        tags: [
            { name: "Auth", description: "Đăng ký, đăng nhập, refresh token, đăng xuất" },
            { name: "User", description: "Quản lý profile & users (Admin)" },
            { name: "Product", description: "Sản phẩm & SKU" },
            { name: "Store", description: "Cửa hàng" },
            { name: "Cart", description: "Giỏ hàng" },
            { name: "Order", description: "Đơn hàng & Checkout" },
            { name: "Inventory", description: "Quản lý tồn kho (Admin/Manager)" },
        ],
    },
    apis: [], // Không dùng JSDoc annotations, define trực tiếp trong definition
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    // Swagger UI
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2em; }
      `,
            customSiteTitle: "KIX Sneaker Shop - API Docs",
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: "none",
                filter: true,
                tagsSorter: "alpha",
            },
        })
    );

    // JSON endpoint
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    console.log("📄 Swagger docs available at http://localhost:5000/api-docs");
}

module.exports = setupSwagger;
