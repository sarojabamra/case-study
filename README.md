# E-commerce Platform Case Study

This project is a full-stack e-commerce platform built as a case study. It features a product catalog, shopping cart functionality, user authentication with Keycloak, an admin panel, and a brand-specific studio for brand staff.

## Features

- **Product Catalog**: Browse products by categories and brands.
- **Shopping Cart**: Add, update, and remove items from the cart. The cart items are stored locally for users that have not logged in.
- **User Authentication**: Secure login/signup for shoppers and brand staff using Keycloak.
- **Protected Routes**: Different access levels for regular users, brand staff (tenants), and administrators.
- **User Account Management**: View orders, update profile details like update passwords, add/remove/edit addresses.
- **Brand Studio**: A dedicated portal for brand staff to manage their products and orders (requires brand-specific login).
- **Admin Panel**: For platform administrators to manage users, products, and other platform settings.
- **Error Handling**: Error display and session management.

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
- **Docker** (for running Keycloak)
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
      - **Authorization**: ON
      - **Standard flow**: ON
      - **Valid redirect URIs**: `http://localhost:5173/*`
      - **Web origins**: `http://localhost:5173`
      - Save the client. Note down the **Client secret** from the "Credentials" tab and update your `.env` file in the project root.

### 4. Database Setup and Seeding

The project uses an SQLite database named `ecommerce.db`. The `seed.py` script will create a fresh database and populate it with sample data, including brands, products, and categories.

1.  **Run the seeding script**:
    From the project root (with your Python virtual environment activated):

    ```bash
    python seed.py
    ```

    This command will:
    - Delete any existing `ecommerce.db`.
    - Create a new `ecommerce.db` with the necessary tables.
    - Populate the database with sample products, categories, and brands.
    - **Important**: After seeding, you will need to manually create a user either in Keycloak or through the /signup route named `admin`. Then run this command:

    ```bash
    python seed.py
    ```

    again. `seed.py` will automatically update the role of that user to `ADMIN`.

### 5. User Creation

After Keycloak and database setup, you need to create users.

#### Normal User (Shopper)

- Register directly through the frontend application's `/signup` page. These users will have the default `USER` role.

#### Admin User

Either:

1.  **Create an admin user through Keycloak**:
    - In Keycloak Admin Console (`http://localhost:8080`), go to the `ecommerce` realm, then "Users".
    - Click "Create new user". Provide a specific username (`admin`) and password.

    (or)

2.  **Create an admin user through the frontend interface**

    Use the /signup route to create a user with the username `admin`

    After 1 (or) 2:

    **Run `seed.py` (again)**:

    ```bash
    python seed.py
    ```

    The `seed.py` script has logic to identify a specific user with the username `admin` and update their role in the application's database to `ADMIN`.

#### Tenant User (Brand Staff)

Tenant users (brand staff) can access their brand's studio. This requires a specific setup:

1. **The Admin Console**:
   - In the Admin Console in the application, the admin can add staff users for specific brands.
   - After selecting the brand. Click "Add staff". Provide a username (e.g., `adidas_staff`) and password.
   - A tenant user with the role `TENANT` will be created.

2. **Tenant Login**:
   - Now the tenant user can user the login credentials provided to sign in.
   - The user can now go to their account settings to change their password accordingly.

3. **Tenant Name Matching**: For the studio access to work, the `user.tenant_name` (which often defaults to the username or is derived from it) must match the tenant name in the URL (e.g., `/adidas/studio`).
   - **Important**: To access the studio, a brand staff member **must log in via their brand's specific login page**. For example, for the "Adidas" brand, they would go to `http://localhost:5173/adidas/login`. Attempting to access the studio via a general shopper login (`http://localhost:5173/login`) will result in a "Brand Studio Access Restricted" message, even if they have the correct tenant role.

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

## Running Tests

### Backend Tests (Pytest)

1.  **Activate your Python virtual environment** (if not already active).
2.  **Run tests from the project root**:
    ```bash
    pytest
    ```

### Frontend Tests (Jest)

1.  **Navigate to the client directory**:
    ```bash
    cd client
    ```
2.  **Run tests**:
    ```bash
    npm test
    # or yarn test
    ```

## Important Notes

- **Database Reset**: Running `python seed.py` will **delete and recreate** your `ecommerce.db` file. This means any manual changes or user data not part of the seed script will be lost.
- **Tenant Login**: The distinction between general login and brand-specific login for tenants is crucial for accessing studio pages. Ensure brand staff use their specific `/:tenant/login` URL.
- **Admin Sync**: The `seed.py` script attempts to synchronize an admin user's role. If you change the default admin username in `seed.py`, ensure the corresponding user exists in Keycloak.
