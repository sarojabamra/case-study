# E-commerce Platform Case Study

This project is a full-stack e-commerce platform built as a case study. It features a product catalog, shopping cart functionality, user authentication with Keycloak, an admin panel, and a brand-specific studio for brand staff.

## Features

- **Catalogue**: Search, filter, sort, and paginate products; the public grid shows 8 products per page in 4 desktop columns.
- **Ratings and reviews**: Product and favourite cards show average stars and review counts. A signed-in customer can leave one 1–5-star review with an optional comment after that product has been delivered.
- **Cart and checkout**: Guests keep a browser cart; signed-in users get a saved cart, addresses, checkout, order history, cancellation, and return requests.
- **Authentication and roles**: Keycloak handles login. `USER`, `TENANT`, and `ADMIN` routes are protected in both the browser and API.
- **Brand studio**: Brand staff manage only their brand’s products, stock, images, and orders through a brand-specific login. The studio shows totals for units sold, products, low-stock items, orders, and revenue.
- **Low-stock warning**: Studio staff see all products below 5 units, including out-of-stock products, with direct stock-update actions.
- **Admin console**: Admins create brands, staff users, and categories. Brand deletion is blocked while staff or products are linked.
- **Safe product deletion**: Products referenced by a saved cart, order history, or customer review cannot be deleted; staff can set stock to 0 instead.
- **Local images**: Product images are validated and stored on the backend filesystem. S3 is not used.

## Technologies Used

- **Frontend**: React (with TypeScript), Vite, TailwindCSS, React Router DOM, Zod (for validation).
- **Backend**: Python (FastAPI), SQLAlchemy (ORM), SQLite (Database).
- **Authentication**: Keycloak (OpenID Connect provider).
- **Testing**: Jest (Frontend), Pytest (Backend).

## ARCHITECTURE

```
+-------+     +----------+     +-----+     +----------+     +--------+
| User  | <-> | Frontend | <-> | API | <-> | Backend  | <-> | Database |
+-------+     +----------+     +-----+     +----------+     +--------+
                  ^    ^           |           ^
                  |    |           |           |
                  +----|-----------+ Authentication (Keycloak)
                       |
                       +------------------------- protected routes based on roles
```

## Local Development Setup

Follow these steps to get the project up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+**
- **Node.js LTS** (and npm or yarn)
- **SQLite3** (usually pre-installed with Python, no separate installation needed unless you encounter issues)

### 1. Backend Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/sarojabamra/case-study
    cd case-study
    ```
2.  **Create and activate a virtual environment**:
    ```bash
    python3 -m venv ecommerce-venv
    source ecommerce-venv/bin/activate
    ```
3.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create `.env` file**:
    Create a file named `.env` in the project root with the following content.
    ```env
    KEYCLOAK_URL=http://localhost:8080
    KEYCLOAK_REALM=ecommerce
    KEYCLOAK_CLIENT_ID=ecommerce-client
    KEYCLOAK_CLIENT_SECRET=<YOUR_KEYCLOAK_CLIENT_SECRET>
    ```

### 2. Frontend Setup

1.  **Navigate to the client directory**:
    ```bash
    cd client
    ```
2.  **Install Node.js dependencies**:
    ```bash
    npm install
    # or yarn install
    ```
3.  **Return to the project root**:
    ```bash
    cd ..
    ```

### 3. Keycloak Setup (Local)

This project uses Keycloak for authentication. You need to run a Keycloak instance and configure it.

1.  **Start a Keycloak instance locally**:

    Inside the folder where you've installed Keycloak, run this command:

    ```bash
    bin/kc.sh start-dev
    ```

    This command starts Keycloak on `http://localhost:8080` (usually)

2.  **Configure Keycloak**:
    - Access Keycloak Admin Console at `http://localhost:8080`.
    - Login with your username and password.
    - **Create a new Realm**: Hover over "Master" in the top-left, click "Add realm", and name it `ecommerce`.
    - **Create a new Client**: Go to the `ecommerce` realm, navigate to "Clients", click "Create client".
      - **Client ID**: `ecommerce-client`
      - **Client authentication**: ON
      - **Standard flow**: ON
      - **Direct Access Grants**: ON
      - **Service Account Roles**: ON
      - Save the client. Note down the **Client secret** from the "Credentials" tab and update your `.env` file in the project root.
      - Then go to the service account roles tab and assign the client `manage-users`, `query-users` and `view-users` roles.
      - Additonally, ensure that we have removed `email`, `fName` and `lName` as required fields from `Realm Settings`-> `User Profile`.

### 4. Database Setup and Seeding

The project uses an SQLite database named `ecommerce.db`. The `seed.py` script creates missing tables and adds sample brands, products, and categories. The catalogue includes Apple, Samsung, Sony, Nike, Adidas, and IKEA, with illustrative USD prices and a mix of available, low-stock, and out-of-stock products. Prices are demo values, not current retail prices.

1.  **Run the seeding script**:
    From the project root (with your Python virtual environment activated):

    ```bash
    python seed.py
    ```

    This command creates any missing tables, roles, categories, brands, and demo products. It does **not** delete `ecommerce.db`, overwrite existing product values, or remove old records.

    It also creates or promotes the local `admin` user to the `ADMIN` role. Create the matching Keycloak identity separately before logging in as that user.

### 5. User Creation

After Keycloak and database setup, you need to create users.

#### Normal User (Shopper)

- Register directly through the frontend application's `/signup` page. These users will have the default `USER` role.

#### Admin User

`seed.py` creates or promotes the local `admin` account to the `ADMIN` role. Create the matching `admin` identity and password in Keycloak, then sign in through the normal `/login` screen. The local account and Keycloak identity must use the same username.

#### Tenant User (Brand Staff)

Tenant users (brand staff) can access their brand's studio. This requires a specific setup:

1. **The Admin Console**:
   - In the Admin Console in the application, the admin can add staff users for specific brands.
   - After selecting the brand. Click "Add staff". Provide a username (e.g., `adidas_staff`) and password.
   - A tenant user with the role `TENANT` will be created.

2. **Tenant Login**:
   - Now the tenant user can user the login credentials provided to sign in.
   - The user can now go to their account settings to change their password accordingly.

3. **Brand-specific login**: To access a studio, staff must use their brand login URL, for example `http://localhost:5173/Adidas/login`. The backend checks both the `TENANT` role and that the staff account belongs to the brand in the URL.

### 6. Running the Application

1.  **Start the Backend (from project root)**:

    ```bash
    uvicorn server.main:app --reload
    ```

    The backend will typically run on `http://localhost:8000`.

2.  **Start the Frontend (from `client` directory)**:
    ```bash
    cd client
    npm run dev
    # or yarn dev
    ```
    The frontend will typically run on `http://localhost:5173`. Open this URL in your browser.

## Key API endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /products/` | Public catalogue, including each product’s `average_rating` and `rating_count`. |
| `GET` / `POST /products/{id}/reviews` | Read public reviews or submit one review after delivery. |
| `GET /products/favourites` | Signed-in user’s favourites, including rating summaries. |
| `GET /{tenant}/studio/summary` | Tenant-only totals for units sold, products, low stock, orders, and revenue. |
| `GET /{tenant}/products/low-stock` | Tenant-only products with quantity below 5. |
| `PUT` / `DELETE /{tenant}/products/{id}` | Update or safely delete a brand product. |

Units sold and revenue are calculated from the brand’s product lines and exclude cancelled orders and approved returns.

## Running Tests

### Backend Tests (Pytest)

1.  **Activate your Python virtual environment** (if not already active).
2.  **Run tests from the project root**:
    ```bash
    ecommerce-venv/bin/python -m pytest -q
    ```

### Frontend Tests (Jest)

1.  **Navigate to the client directory**:
    ```bash
    cd client
    ```
2.  **Run tests**:
    ```bash
    npm test -- --runInBand
    npm run build
    ```

## Important Notes

- **Repeatable seeding**: Running `python seed.py` adds only missing seed records. It does not delete existing data, overwrite existing stock/prices, or remove older brands and products.
- **Tenant Login**: The distinction between general login and brand-specific login for tenants is crucial for accessing studio pages. Ensure brand staff use their specific `/:tenant/login` URL.
- **Admin Sync**: The `seed.py` script attempts to synchronize an admin user's role. If you change the default admin username in `seed.py`, ensure the corresponding user exists in Keycloak.

### Product image storage

Product images are saved on the backend filesystem in `product-images-data/` by default. Set `LOCAL_OBJECT_STORE_PATH` to use a different directory. The backend serves images through `/products/{product_id}/image`; the database stores their file keys and content types. No S3 configuration or dependency is required.

For a fuller explanation of the architecture, every feature flow, and every application file, read [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md).
