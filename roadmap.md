# Introduction

This document describes a plan to create a multiplayer, online version of the traditional Italian card game Mercante in Fiera. The goal is to provide an engaging, real-time experience where users can buy, sell, and trade cards, participate in auctions, and vie for top prizes—all while enjoying seamless gameplay and global connectivity.

# Rules of the Game

Mercante in Fiera is traditionally played with two decks of 40 cards each (Italian suits: Coins, Cups, Swords, Clubs). One deck is distributed or sold to players (face down, so it’s all a mystery), and the other deck is used to reveal “losing” cards one by one. Cards from the first deck that match the revealed “losers” from the second deck are eliminated from winning contention. Usually, there are a few “winning cards” left that split the prize pot according to agreed-upon percentages.

# Key points:

Players & Merchant

One person acts as the Merchant (dealer). Other participants buy, trade, and hold cards.

The are two decks with 40 different cards, the cards of the two decks are identical but the back of the two decks are different colours

After both decks are shuffled by the dealer (called the "merchant"), three to seven cards (user choice) from one of the decks are placed faced down on the table. These cards represent the "winning cards" from first prize, second price, etc. The rest of this deck is placed aside in a pile beside the winner cards. Default as 5 winner cards.

To participate in the game, each player must play an entrance fee (determined by the users)

Once every player pays their fee, a% of the total pot is placed on the back of the first place card, b% on the back of the second place, c% on the back of the first place card, etc. until a percent is set for all the winner cards. Default as 35% for first place, 25% for second, 20% for third, 10% for fouth, and 10% for fifth.

Afterwrds, the merchant distributed the second deck of cards evenly across the players. If it cannot be distributed evenly, the remaining cards are auctioned by the merchant to the players and the money is then distributed onto the winning cards in the same percentage. If no player wants buy the extra cards, they are assogmed randomly to the players.

Once every player has their cards, they turn them all face up in front of them.

The merchant then grabs the remaining pile of cards from the first deck and begins to turn them over, announcing them one by one (every card flip can be considered as a "turn")

When a card is turned over from the first deck, the matching card in the second deck is considered a "loser" and it is discarded.

Between each turn, players can trade cards with eachother or buy cards from other players

Once a player loses all of their cards, they are out of the game unless they buy a card from another player or, if they have any, the merchant

Turns continue until there are no more cards remaining in deck 1, except the face down winner cards with money on the back of them

The merchant then flips over the "winning cards" in reverse order (5th first and 1st last). When a "winning card" is turned over, the player who has the matching card wins the money on the back of the "winning card"

Inbetween these turns, players can still trade cards or buy them from one another

The game ends after the merchant has flipped over 1st place card and the money is given to whoever had the matching card

# Variations

Trades among players, optional auctions, multiple or custom winning conditions, and side bets are common house-rule variations.

# Roadmap

## Phase 1: Planning and Requirements

### Objectives

Create an online multiplayer version of Mercante in Fiera accessible globally.
Implement real-time features: card trading, auctions, reveals, etc.
Ensure a user-friendly interface and a scalable backend.

### Key Features

Game Setup: Two 40-card decks, configurable entrance fee, custom winning conditions.
Gameplay: Card distribution, auctions for leftover cards, turn-based reveals.
Multiplayer: Global matchmaking, room creation, real-time communication.
Admin/Merchant Role: Dedicated controls for card dealing and auction management.
Game End Mechanics: Automatic prize payouts based on final “surviving” cards.
Accessibility: Mobile and desktop support, multiple language localization.

Cards: The two decks are identical but the back of the two decks are different colours. The faces of the cards are as follows (english word on the left, italian word on the right):
    The King – Il Re
    The Queen – La Regina
    The Merchant – Il Mercante
    The Sailor – Il Marinaio
    The Knight – Il Cavaliere
    The Farmer – Il Contadino
    The Beggar – Il Mendicante
    The Fool – Il Matto
    The Witch – La Strega
    The Monk – Il Monaco
    The Dog – Il Cane
    The Cat – Il Gatto
    The Horse – Il Cavallo
    The Pig – Il Maiale
    The Chicken – La Gallina
    The Fish – Il Pesce
    The Grapes – L’Uva
    The Barrel – La Botte
    The Key – La Chiave
    The Sword – La Spada
    The Treasure Chest – Il Forziere
    The Candle – La Candela
    The Moon – La Luna
    The Sun – Il Sole
    The Star – La Stella
    The Tower – La Torre
    The Ship – La Nave
    The Windmill – Il Mulino
    The Heart – Il Cuore
    The Clover – Il Trifoglio
    The Ring – L’Anello
    The Bell – La Campana
    The Mask – La Maschera
    The Harlequin – L’Arlecchino
    The Devil – Il Diavolo
    The Angel – L’Angelo
    The Rose – La Rosa
    The Butterfly – La Farfalla
    The Rainbow – L’Arcobaleno
    The Goblet – Il Calice

## Phase 2: Technical Design

### Backend Architecture

Node.js + Express with Socket.IO for real-time interactions.
PostgreSQL (or MongoDB) for storing game states.
AWS/Azure for cloud hosting.

### Frontend Architecture

React.js for a dynamic, interactive UI.
WebSockets (via Socket.IO) for instant updates.
Responsive Design with Tailwind CSS or Bootstrap.

### Game Logic

Algorithms for shuffling, distribution, bidding logic, and final prize calculation.
Turn-by-turn elimination of cards, real-time auction, and trading.

## Phase 3: Development

### Milestones

Core Mechanics (Backend): Card shuffle, distribution, API endpoints, real-time events.
Frontend Development: Game room UI, card animations, trade/auction/prize interfaces.
Multiplayer Functionality: Room creation, matchmaking, real-time sync.
Testing & Iteration: Unit tests (backend), usability tests (frontend), load tests.

## Phase 4: Deployment

### Backend Deployment

Use AWS (Elastic Beanstalk or ECS) or Azure App Service.
Configure DB (AWS RDS), secure connections, environment variables.

### Frontend Deployment

Host on Vercel, Netlify, or an S3/CloudFront combo.
Optimize for performance and quick load times.

### Global Accessibility

CDN integration for static assets.
Monitor latency, ensure minimal real-time delays.

## Phase 5: Post-Launch Enhancements

### Features to Add

Custom Game Modes, more advanced trade rules.
Player Profiles with stats, achievements, leaderboards.
Chat System for in-game text communication.
AI Merchant if no human dealer is available.

### Maintenance

Ongoing bug fixes, performance optimizations.
Regularly add new features to keep the game fresh.


#  Ultimate Tech Stack

### Frontend

React + TypeScript
Component-based, efficient, and strongly typed to reduce bugs.
Redux (or Zustand/Recoil)
Manages global state for game sessions, auctions, and user data.
Tailwind CSS
Utility-first CSS framework for quick, responsive UI layouts.
Socket.IO Client
Real-time communication for in-game actions and chat.

### Backend

Node.js + Express
High-performance, lightweight server-side framework in JavaScript/TypeScript.
Socket.IO
Handles real-time events: auctions, reveals, trades, etc.
TypeScript
Adds reliability and clarity to server code.
Database ORM: Prisma or Sequelize
Simplifies queries, migrations, and ensures data consistency.

### Database

PostgreSQL (Neon)
Relational database well-suited for transactions and complex queries.
Redis (Optional)
In-memory data store for caching sessions, game state snapshots, or user data.

### Hosting & CI/CD

AWS or Azure
Elastic Beanstalk/ECS (AWS) or App Service (Azure) for the Node.js backend.
RDS (Postgres) or Azure Database for PostgreSQL.
Vercel or Netlify
Quick, straightforward hosting solutions for React apps.
CI/CD
GitHub Actions or GitLab CI for automated testing and deployments.
Step-by-Step Development Process
Below is a simplified guide on how to build the application incrementally, adopting best practices for each part.

### Step 1: Project Setup

Initialize Repositories
Create Git repos (separate or monorepo).

### Backend Folder Structure (e.g., mercante-backend/):

arduino
Copy code
src/
  ┣ config/
  ┣ controllers/
  ┣ routes/
  ┣ services/
  ┣ sockets/
  ┣ models/
  ┗ index.ts
Frontend Folder Structure (e.g., mercante-frontend/):
arduino
Copy code
src/
  ┣ components/
  ┣ pages/
  ┣ store/
  ┣ services/
  ┗ App.tsx
public/

### Install Dependencies

Backend: express, socket.io, cors, dotenv, typescript, prisma/sequelize, etc.
Frontend: react, typescript, redux, socket.io-client, tailwindcss, etc.

### Initialize TypeScript

Configure tsconfig.json for both frontend and backend.

### Step 2: Database Schema and ORM Setup

Plan Your Entities
User, Game, Card, Auction, etc.
Define Models using Prisma or Sequelize.
Set Up Migrations to initialize and track schema changes in your Postgres DB.

### Step 3: Basic REST APIs

Authentication
Endpoints for register/login (use bcrypt for password hashing, JWT for sessions).
User Management
Basic routes (GET /users/:id, PATCH /users/:id).
Game Management
Routes to create/join/fetch games.
Error Handling & Logging
Consistent error middleware, log management with Winston or pino.

### Step 4: Real-Time with Socket.IO

Server Setup
Initialize Socket.IO in index.ts.
Rooms
Use a room per game (socket.join(game_{id})).
Events
auctionUpdate, tradeUpdate, cardReveal, etc.
Server-Side Logic
Validate token on connection, manage real-time state on the server to prevent cheating.

### Step 5: Frontend Integration

Socket Service
Create a socket.ts to handle the client-side Socket.IO connection.
State Management
Use Redux slices or another pattern to manage game data.
UI Components
Auction modals, card layout, scoreboard, real-time notifications.
Event Handling
socket.on('auctionUpdate', ...) → dispatch Redux actions.

### Step 6: Game Logic Implementation

Card Shuffling & Dealing
Secure randomization on the server side.
Auctions
Track bids, timeouts, highest bidder, etc.
Revealing “Losing” Cards
Turn-based reveal from the second deck, eliminate matching cards in real-time.
Prize Distribution
Calculate pot shares, update user balances.

### Step 7: Testing & QA

Unit Tests
Jest + Supertest for backend routes, React Testing Library for frontend.
Integration & Stress Testing
Tools like Artillery or k6 to simulate large concurrent sessions.
User Acceptance
Gather user feedback, refine UX accordingly.

### Step 8: Deployment

Backend
Deploy via AWS Elastic Beanstalk or Azure App Service.
Database on AWS RDS or Azure Database for PostgreSQL.
Frontend
Deploy on Vercel/Netlify, or host via S3 + CloudFront.
Environment Variables
Keep secrets (JWT keys, DB credentials) in secure storage.
CDN & Caching
Use a CDN for faster static asset delivery.

### Step 9: Post-Launch Enhancements

Customization: Different rules or card sets, advanced analytics for user stats.
Player Profiles: Achievements, match history, leaderboards.
Chat System: In-game text and emotes.
AI Merchant: Automated dealing for single-player or fewer human players.
