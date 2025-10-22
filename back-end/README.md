# Getting Started with the back-end

## Prerequisites

### Node.js and npm

You will need to install Node.js and node package manager (npm) to run the application.
You can download Node.js from <https://nodejs.org/en/download/>.
Make sure to download the LTS version.

### VSCode

Throughout the lessons we'll use VSCode for the exercises. Make sure you have the following extensions downloaded and enabled:

-   Prettier - Code formatter
-   Auto Rename Tag
-   GitLens - Git supercharged

Open the settings of VSCode, search for **Format on save** and make sure it's checked. This assures that every time you save a file, it's being formatted according to the code style rules described in **.prettier.rc**.

Replace the values with your local configuration.

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root of the `back-end` folder with the following variables:

```
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Application Configuration
APP_PORT=3000

# Security
JWT_SECRET="your-secret-key-here"
```

Make sure to replace the placeholder values with your actual configuration:
- `DATABASE_URL`: Your PostgreSQL connection string (format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`)
- `APP_PORT`: The port on which the server will run (default: 3000)
- `JWT_SECRET`: A secure random string for JWT token generation

### Database Setup

**IMPORTANT**: You must create the database tables before running the application. The application will fail with a "table does not exist" error if you skip this step.

1. Make sure PostgreSQL is installed and running on your machine
2. Create a database for the application (or use the default `postgres` database)
3. Update the `DATABASE_URL` in the `.env` file with your PostgreSQL credentials
4. Run the following commands to set up the database:

```console
> npm run prisma:generate
> npm run prisma:migrate
```

These commands will generate the Prisma client and apply all migrations to your database.

#### Alternative Database Setup (if Prisma migrations fail)

If you encounter issues with Prisma migrations, you can use the provided setup script or manually create the required tables:

##### Option 1: Using the Setup Script (Recommended)

We've created a helper script to make database setup easier:

```console
> npm run setup:db
```

Or you can run it directly:

```console
> node setup-database.js
```

This script will:
1. Read your database connection info from the `.env` file
2. Prompt you to confirm before proceeding
3. Execute the SQL script to create all necessary tables
4. Show detailed error messages if something goes wrong

##### Option 2: Manual Setup

If you prefer to set up the database manually:

1. Make sure PostgreSQL is installed and running on your machine
2. Connect to your PostgreSQL database using a tool like pgAdmin or psql
3. Run the SQL commands in the `create_tables.sql` file to create the necessary tables

```console
> psql -U postgres -d postgres -f create_tables.sql
```

Replace `postgres` with your database username and database name if different.

#### Verifying Database Setup

You can verify that the tables were created successfully by connecting to your database and running:

```sql
SELECT * FROM "public"."inventorys";
```

If this returns an empty result (rather than an error), the tables have been created successfully.

## Starting the application

Run the following commands in a terminal (**cd in the `back-end` folder!!**), to get the application up and running.

First, install all required node dependencies using npm (node package manager):

```console
> npm install
```

Then, to start the backend server execute:

```console
> npm start
```

## Testing

Open your browser and navigate to <http://localhost:3000/status>.

A message saying "Back-end is running..." should appear.

If this is the case, you have succesfully completed the installation process.
