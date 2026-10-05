# ProjectHive – Assignment & Research Project Management

An internal admin tool for **ProjectHive**. It tracks every assignment, research and software project from the first client request to completion, and shows what each one earns:

```
Client Price − Developer Cost = ProjectHive Profit
```

## 1. Overview

- **Dashboard** – project counts, total revenue, developer cost and profit, recent projects, upcoming deadlines and overdue projects.
- **Projects** – create, view, edit and delete projects; search and filter; change status and record payments in one click; a timeline of everything that happened to a project.
- **Developers** – the people work is assigned to, with their assigned/active/completed projects and total cost.
- **Settings** – change the admin's name, email and password.
- **Admin login** – there is no public sign-up. Only a logged-in admin can open any page or call any API route.

All amounts are in Sri Lankan Rupees and shown as `Rs. 25,000.00`. Profit, profit %, remaining payment and payment status are always calculated on the server.

## 2. Technology stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript (strict)         |
| UI         | Tailwind CSS 4, shadcn/ui, Lucide icons                        |
| Backend    | Next.js Route Handlers (`app/api`)                             |
| Database   | MongoDB Atlas, accessed through Prisma 6                       |
| Validation | Zod (the same schemas are used in the forms and in the API)    |
| Auth       | Email + password, bcrypt hashes, signed httpOnly session cookie |

## 3. Requirements

- Node.js 20.9 or newer
- npm
- A MongoDB Atlas cluster (the free tier is enough)

## 4. Installation

```bash
npm install
npm run db:push          # create collections and indexes in Atlas
npm run dev              # http://localhost:3000
```

Then add the admin login to the database by hand (section 7).

## 5. Database setup

1. In [MongoDB Atlas](https://cloud.mongodb.com), create a cluster and a database user.
2. Under **Network Access**, allow the IP address of the machine (or host) that runs the app.
3. Click **Connect → Drivers** and copy the connection string, adding the database name (`/projecthive`) before the `?`.

## 6. Prisma schema ("migrations")

The schema lives in `prisma/schema.prisma`. MongoDB has no SQL migrations, so Prisma's `migrate` commands do not apply. To apply the schema (collections, unique constraints and indexes), run:

```bash
npm run db:push
```

Run it again whenever `prisma/schema.prisma` changes. `npm run db:studio` opens Prisma Studio to browse the data.

## 7. Creating the admin login

There is no seed script and no sign-up page. The admin account is added to MongoDB by hand, once. Developers and projects are then added through the system itself.

1. Generate a password hash (replace `YourPassword` with the password you want, at least 8 characters):

   ```bash
   node -e "require('bcryptjs').hash('YourPassword', 12).then(console.log)"
   ```

   It prints a hash starting with `$2b$12$`. Passwords are never stored as plain text.

2. In MongoDB Atlas, open **Browse Collections → your database → `admins`** and click **Insert Document**. Switch to the `{}` (JSON) view and paste this, with your own name, email and the hash from step 1:

   ```json
   {
     "name": "ProjectHive Admin",
     "email": "admin@projecthive.lk",
     "passwordHash": "PASTE_THE_HASH_HERE",
     "sessionVersion": 0,
     "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
     "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
   }
   ```

   - The email must be **lowercase**.
   - Keep every field: the app expects all six.
   - If the `admins` collection is missing, run `npm run db:push` first.

3. Log in at `/login` with that email and password.

## 8. Development

```bash
npm run dev         # start the dev server
npm run typecheck   # TypeScript checks
npm run lint        # ESLint
```

## 9. Production build

```bash
npm run build
npm run start
```

The session cookie is marked `Secure` in production, so serve the app over HTTPS.

## 10. Admin credentials

There is no default admin and no default password. The login is whatever email and password you set in section 7. The password can be changed later under **Settings → Change Password**, which also signs out every other device.

## 11. Project structure

```
app/
  (app)/                 Pages behind the login (sidebar + header layout)
    dashboard/           Dashboard
    projects/            List, new, details ([id]) and edit ([id]/edit)
    developers/          List, new, profile ([id]) and edit ([id]/edit)
    settings/            Admin profile and password
  api/                   REST API route handlers
  login/                 Login page
components/
  ui/                    shadcn/ui components
  shared/                Reusable pieces: badges, stat cards, money, form fields, empty/error states
  layout/                Sidebar, header, navigation, user menu
  projects/ developers/ dashboard/ settings/ auth/
lib/
  services/              Business logic and database access (projects, developers, dashboard, admin)
  validation/            Zod schemas shared by forms and API
  auth/                  Sessions, password hashing, login rate limiting
  api/http.ts            API helpers: auth wrapper, JSON responses, error handling
  finance.ts             Profit, profit %, remaining amount, payment status
  dates.ts               Deadline logic (overdue / upcoming)
  format.ts              Currency and date formatting
  constants.ts           Statuses, types, priorities and their labels
prisma/
  schema.prisma          Database models
proxy.ts                 Blocks requests without a valid session (Next.js 16 "proxy", formerly middleware)
```

### Business rules

- **Profit** = Client Price − Developer Cost. **Profit %** = Profit ÷ Client Price × 100. **Remaining** = Client Price − Paid Amount.
- **Payment status** follows the amounts: nothing paid → *Pending*, part paid → *Partially Paid*, all paid → *Fully Paid*. *Refunded* is set with a checkbox.
- **Overdue** = the deadline has passed and the project is not Completed or Cancelled. **Upcoming** = due within the next 7 days. Dates use Sri Lanka time.
- **Dashboard counts**: *Pending* = status New; *Active* = Assigned, In Progress, Review, Client Review or Revision. Cancelled projects are left out of revenue, cost and profit.
- A project with status *New* becomes *Assigned* automatically when a developer is chosen.
- **Project IDs** (`PH-2026-0001`) are generated per year and never reused.
- A developer with assigned projects cannot be deleted (this keeps the cost history) – mark them *Inactive* instead.

## 12. API overview

Every route except login and logout requires a logged-in admin and returns `401` otherwise. Responses are `{ "data": ... }` on success and `{ "error": { "message", "fieldErrors"? } }` on failure (`400` bad JSON, `404` not found, `409` conflict, `422` validation, `429` too many login attempts).

| Method   | Route                  | Description                                                                 |
| -------- | ---------------------- | --------------------------------------------------------------------------- |
| `POST`   | `/api/auth/login`      | Log in with `{ email, password }`                                           |
| `POST`   | `/api/auth/logout`     | Log out                                                                     |
| `GET`    | `/api/auth/me`         | The logged-in admin                                                         |
| `PUT`    | `/api/auth/profile`    | Update admin name and email                                                 |
| `PUT`    | `/api/auth/password`   | Change password                                                             |
| `GET`    | `/api/dashboard`       | Statistics, recent projects, upcoming deadlines, overdue projects           |
| `GET`    | `/api/projects`        | List projects. Query: `q`, `status`, `projectType`, `developerId` (or `unassigned`), `paymentStatus`, `deadline` (`overdue`, `week`, `month`) |
| `POST`   | `/api/projects`        | Create a project                                                            |
| `GET`    | `/api/projects/[id]`   | One project with its activity timeline                                      |
| `PUT`    | `/api/projects/[id]`   | Update a project (full form)                                                |
| `PATCH`  | `/api/projects/[id]`   | Quick update: any of `status`, `developerId`, `advancePaid`, `refunded`     |
| `DELETE` | `/api/projects/[id]`   | Delete a project and its timeline                                           |
| `GET`    | `/api/developers`      | List developers with their statistics. Query: `q`, `status`                 |
| `POST`   | `/api/developers`      | Add a developer                                                             |
| `GET`    | `/api/developers/[id]` | One developer with their projects                                           |
| `PUT`    | `/api/developers/[id]` | Update a developer                                                          |
| `DELETE` | `/api/developers/[id]` | Delete a developer (only when no projects are assigned)                     |
