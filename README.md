# WIHCN Register Hub

Build a production-ready conference registration platform for:

WIHCN CON III

3RD ANNUAL CONFERENCE

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

EVENT:

Friday, 30 October 2026

8:30 a.m. – 5:30 p.m.

After Party: 6:00 p.m. – 9:00 p.m.

Harbour Point, Lagos

HASHTAG:

#WIHCNCON3

CORE MESSAGE:

“A more inclusive healthcare future is possible.”

Use the supplied conference artwork as the visual reference.

IMPORTANT:

This is NOT just a marketing landing page.

Build:

1. A premium public one-page conference website

2. A complete attendee registration system

3. Paystack payment integration

4. Automatic QR ticket generation

5. Email ticket/confirmation workflow

6. Secure admin dashboard

7. Event-day QR check-in/scanning system

8. Attendee category management

9. Speaker and panelist management

10. Badge-printing workflow

The registration and check-in workflow are core requirements.

====================================================

TECH STACK

====================================================

Use:

- React

- TypeScript

- Tailwind CSS

- Supabase for database/authentication

- Supabase Edge Functions for secure server-side operations

- Paystack for payments

- QR code generation

- Responsive design

- PWA-friendly mobile/tablet experience

Keep all secret/API keys out of frontend code.

Use environment variables/secrets appropriately.

====================================================

PUBLIC WEBSITE

====================================================

Create a single-page public website.

Navigation:

HOME

ABOUT

THEME

SPEAKERS

PROGRAMME

VENUE

FAQ

REGISTER

Sticky navigation.

The REGISTER button should remain prominent.

====================================================

HERO

====================================================

Create a premium conference hero.

Text:

3RD ANNUAL CONFERENCE

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

30 OCTOBER 2026

HARBOUR POINT, LAGOS

“A more inclusive healthcare future is possible.”

Buttons:

REGISTER NOW

VIEW PROGRAMME

Display:

#WIHCNCON3

Add subtle motion but avoid excessive animation.

The hero should feel like a major healthcare leadership conference.

====================================================

EVENT DETAILS

====================================================

Create four information cards:

DATE

Friday, 30 October 2026

TIME

8:30 a.m. – 5:30 p.m.

AFTER PARTY

6:00 p.m. – 9:00 p.m.

VENUE

Harbour Point

Lagos

====================================================

ABOUT

====================================================

Create a concise section explaining the conference.

Focus on:

- healthcare

- leadership

- innovation

- collaboration

- professional development

- building the future of care

Use:

CONNECT

INFORM

INSPIRE

as three visual pillars.

Do not invent statistics or claims that have not been supplied.

====================================================

THEME

====================================================

Create a strong visual section:

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

Make these three ideas visually prominent:

LEADERSHIP

LEGACY

INNOVATION

====================================================

KEYNOTE SPEAKER

====================================================

Create a premium speaker section.

KEYNOTE SPEAKER

Dr. Omobola Johnson

SENIOR PARTNER, TLCOM CAPITAL

Use a professional image placeholder.

Include an editable biography field.

Do NOT invent additional biography details.

The admin must be able to edit the speaker information.

====================================================

SPEAKERS & PANELISTS

====================================================

Create a dynamic speaker section.

Admin-controlled.

Each speaker card should support:

- Photo

- Name

- Job title

- Organisation

- Biography

- Role

- Speaker / Panelist

Display speakers in a modern responsive grid.

====================================================

PROGRAMME

====================================================

Create an editable conference programme.

Main event:

8:30 a.m. – 5:30 p.m.

CONFERENCE

6:00 p.m. – 9:00 p.m.

AFTER PARTY

Create database-driven programme sessions.

Each session should have:

- Time

- Title

- Description

- Speaker(s)

- Session type

- Display order

Admin can add/edit/delete sessions.

Do not invent programme sessions.

====================================================

REGISTRATION

====================================================

Create a polished registration experience.

Registration fields:

FIRST NAME

LAST NAME

EMAIL

PHONE NUMBER

ORGANISATION

JOB TITLE

CITY

COUNTRY

REGISTRATION CATEGORY

The registration category must come from the database.

Do NOT hard-code prices.

Admin should be able to create categories such as:

- General

- Speaker

- Panelist

but allow additional categories.

Each category should have:

name

description

price

active/inactive

Show the selected price clearly before payment.

====================================================

REGISTRATION VALIDATION

====================================================

Validate:

- Required fields

- Valid email

- Valid phone

- Category selection

Prevent duplicate registrations based on email where appropriate.

Show useful validation messages.

After submitting:

Create a pending registration.

Do NOT mark the attendee as paid.

Then move them to payment.

====================================================

PAYSTACK

====================================================

Integrate Paystack.

FLOW:

Registration form

↓

Create pending attendee

↓

Generate payment reference

↓

Open Paystack checkout

↓

User completes payment

↓

Paystack webhook

↓

Server verifies payment

↓

Mark registration as PAID

↓

Generate attendee ID

↓

Generate QR ticket

↓

Send confirmation email

IMPORTANT:

Payment confirmation must happen server-side.

Do not trust only the frontend payment callback.

Use Paystack webhook/payment verification as the authoritative payment confirmation.

Store:

paystack_reference

payment_status

payment_amount

payment_currency

paid_at

Never expose secret Paystack credentials in client-side code.

====================================================

ATTENDEE ID

====================================================

After verified payment generate a unique attendee ID.

Example format:

WIHCN26-000001

The ID must be unique.

Do not expose database internal IDs as the public ticket identifier.

====================================================

QR TICKET

====================================================

Generate a unique QR code for every paid attendee.

QR payload should use a secure unique ticket reference.

Do not place sensitive personal information directly inside the QR code.

Ticket should display:

WIHCN CON III

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

30 OCTOBER 2026

HARBOUR POINT, LAGOS

ATTENDEE

[Full Name]

ATTENDEE ID

[ID]

CATEGORY

[Category]

QR CODE

Create a polished digital ticket.

Allow ticket viewing on mobile.

Provide an option to download/print the ticket.

====================================================

EMAIL

====================================================

After successful verified payment:

Send registration confirmation email.

Email should contain:

Registration confirmed

WIHCN CON III

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

30 October 2026

Harbour Point, Lagos

Attendee name

Attendee ID

Registration category

QR ticket

Also provide a link to view the ticket online.

Create a mechanism to resend the ticket from the admin dashboard.

Use a transactional email provider through a secure server-side function.

Do not expose email API keys.

====================================================

DATABASE

====================================================

Create these Supabase tables.

-------------------------

ATTENDEES

-------------------------

id

attendee_id

first_name

last_name

email

phone

organisation

job_title

city

country

category_id

payment_status

payment_reference

payment_amount

payment_currency

paid_at

ticket_reference

ticket_status

check_in_status

check_in_time

created_at

updated_at

-------------------------

REGISTRATION_CATEGORIES

-------------------------

id

name

description

price

currency

active

created_at

updated_at

-------------------------

PAYMENTS

-------------------------

id

attendee_id

provider

reference

amount

currency

status

paid_at

raw_reference

created_at

-------------------------

TICKETS

-------------------------

id

attendee_id

ticket_reference

qr_token

issued_at

status

-------------------------

CHECK_INS

-------------------------

id

attendee_id

checked_in_at

checked_in_by

device

created_at

-------------------------

SPEAKERS

-------------------------

id

name

title

organisation

biography

image_url

role

display_order

active

created_at

updated_at

-------------------------

PROGRAMME_SESSIONS

-------------------------

id

title

description

start_time

end_time

session_type

display_order

active

created_at

updated_at

-------------------------

FAQS

-------------------------

id

question

answer

display_order

active

====================================================

ADMIN DASHBOARD

====================================================

Create:

/admin

Require secure authentication.

Dashboard overview cards:

TOTAL REGISTERED

PAID

PENDING

CHECKED IN

GENERAL

SPEAKERS

PANELISTS

Add registration analytics.

====================================================

ATTENDEE MANAGEMENT

====================================================

Admin can:

- Search attendees

- Search by name

- Search by email

- Search by attendee ID

- Search by ticket reference

- Filter by category

- Filter by payment status

- Filter by check-in status

- View attendee details

- Edit attendee details

- Manually register attendee

- Mark payment manually where appropriate

- Resend ticket

- View QR ticket

- Check attendee in manually

Add CSV export.

====================================================

SPEAKER MANAGEMENT

====================================================

Admin can:

ADD SPEAKER

EDIT SPEAKER

DELETE SPEAKER

ACTIVATE/DEACTIVATE SPEAKER

Fields:

Name

Title

Organisation

Biography

Image

Role

Role:

SPEAKER

PANELIST

KEYNOTE

====================================================

CATEGORY MANAGEMENT

====================================================

Admin can create/edit registration categories.

Fields:

Name

Description

Price

Currency

Active

Examples can include:

General

Speaker

Panelist

But these should NOT be permanently hard-coded.

====================================================

CHECK-IN DASHBOARD

====================================================

Create:

/check-in

This interface must be optimized for tablets and phones.

Large QR scanner area.

Flow:

SCAN QR

↓

FIND TICKET

↓

DISPLAY ATTENDEE

↓

SHOW CATEGORY

↓

CONFIRM CHECK-IN

↓

DISPLAY BADGE TYPE

When valid and not checked in:

Show:

CHECK-IN SUCCESSFUL

Attendee name

Attendee ID

Category

Then display:

GENERAL

Standard badge

or:

SPEAKER

Banner badge

or:

PANELIST

Colour-strip badge

====================================================

DUPLICATE CHECK-IN

====================================================

If already checked in:

Display:

ALREADY CHECKED IN

Attendee:

[Name]

Checked in:

[Time]

Do not create a second check-in record.

====================================================

INVALID QR

====================================================

If QR is invalid:

INVALID TICKET

This QR code is not associated with a valid attendee.

====================================================

BADGE WORKFLOW

====================================================

After successful scanning, determine badge type from attendee category.

GENERAL:

Standard badge

SPEAKER:

Banner badge

PANELIST:

Colour-strip badge

Create a badge preview component.

The badge should display:

Name

Organisation

Category/Role

Attendee ID

Create print-friendly CSS.

Add:

PRINT BADGE

button.

The design should support thermal/label printer workflows later.

====================================================

SECURITY

====================================================

Implement:

- Supabase Row Level Security

- Secure admin authentication

- Protected admin routes

- Protected check-in routes

- Server-side Paystack verification

- Server-side webhook

- Unique ticket tokens

- Input validation

- Rate limiting where appropriate

- No secret keys in frontend

- No sensitive attendee data inside QR codes

Public users should only be able to access their own ticket through a secure ticket reference/token.

====================================================

MOBILE EXPERIENCE

====================================================

The public site must work beautifully on:

Desktop

Tablet

Mobile

The check-in interface should be specifically optimized for:

iPad

Android tablets

Mobile phones

Make buttons large enough for event staff to use quickly.

====================================================

DESIGN

====================================================

Use the supplied conference artwork as the primary visual reference.

The design should communicate:

Healthcare

Leadership

Innovation

Legacy

Professionalism

National conference

Networking

Use sophisticated typography.

Use the conference's existing visual direction rather than creating a random colour palette.

Use:

- Elegant cards

- Strong headings

- Clean grids

- Rounded corners

- Subtle shadows

- Premium spacing

- Smooth scrolling

- Light animation

- Strong visual hierarchy

Avoid:

- Generic SaaS templates

- Excessive gradients

- Cartoon graphics

- Over-animation

- Clutter

- Tiny typography

- Excessive stock photography

====================================================

RESPONSIVE NAVIGATION

====================================================

Desktop:

HOME | ABOUT | THEME | SPEAKERS | PROGRAMME | VENUE | FAQ | REGISTER

Mobile:

Hamburger navigation.

Sticky REGISTER button.

====================================================

VENUE

====================================================

Display:

HARBOUR POINT

LAGOS

Add a map placeholder/integration.

Button:

GET DIRECTIONS

Do NOT invent the exact street address.

====================================================

FAQ

====================================================

Create editable FAQ accordion.

Suggested questions:

Who can attend?

How do I register?

How do I pay?

When will I receive my ticket?

How do I access my QR code?

What happens when I arrive?

What happens if I lose my ticket?

Can I transfer my ticket?

All answers must be editable by the admin.

====================================================

FINAL CTA

====================================================

Create a large final CTA:

READY TO CONNECT, INFORM & INSPIRE?

Join us at WIHCN CON III.

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

30 OCTOBER 2026

HARBOUR POINT, LAGOS

REGISTER NOW

====================================================

FOOTER

====================================================

WIHCN CON III

BEYOND LEADERSHIP

Building Legacy & Advancing Innovation

30 October 2026

Harbour Point, Lagos

#WIHCNCON3

Add editable placeholders for:

Email

Phone

Website

Instagram

LinkedIn

Facebook

X

====================================================

IMPORTANT IMPLEMENTATION RULE

====================================================

Build the application incrementally.

FIRST:

Build the public landing page and registration UI.

SECOND:

Create Supabase database schema and authentication.

THIRD:

Implement registration categories.

FOURTH:

Implement Paystack payment initialization.

FIFTH:

Implement Paystack webhook verification.

SIXTH:

Implement QR ticket generation.

SEVENTH:

Implement email confirmation.

EIGHTH:

Build admin dashboard.

NINTH:

Build QR check-in.

TENTH:

Build badge preview and printing.

After each major stage, verify that the existing functionality still works.

Do not replace working functionality when adding new features.

====================================================

SUCCESS CRITERIA

====================================================

A real attendee should be able to:

1. Visit the website

2. Understand the event

3. Click REGISTER NOW

4. Complete registration

5. Select a registration category

6. Pay using Paystack

7. Have payment verified

8. Receive a unique attendee ID

9. Receive a QR ticket by email

10. Arrive at the event

11. Show the QR code

12. Staff scans it using a tablet

13. System identifies the attendee

14. System identifies General/Speaker/Panelist

15. System prevents duplicate check-in

16. Staff can print the correct badge

An administrator should be able to:

1. Log into admin

2. View registrations

3. Manage categories

4. Manage speakers

5. Manage panelists

6. Manage programme

7. Search attendees

8. View payment status

9. View check-in status

10. Resend tickets

11. Manually check in attendees

12. Export attendee records

Build the application with clean, maintainable, production-ready code and a polished visual design.ts start with the front end and design layout frist. we build the bckebd katter

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://wihcn-con-spark.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/98c94acd-9c12-481b-a8ca-67f6d3c57627).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
