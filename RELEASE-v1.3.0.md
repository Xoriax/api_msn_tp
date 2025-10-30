# Release Notes v1.3.0

## API Events Management System v1.3.0

### New Features

**Photo Management Enhancements**
- Complete photo likes system with like/unlike functionality
- User tracking for photo likes with duplicate prevention
- Enhanced photo responses with like counts and user status

**Advanced Ticket Management**
- Ticket cancellation system with status tracking (active/cancelled/used)
- Smart ticket type deletion based on quantity_sold counter
- Automatic stock management with cancellation refunds
- Detailed cancellation logging with timestamps and reasons

**System Improvements**
- Enhanced data validation and error handling
- Improved API documentation with comprehensive endpoint coverage
- Better response consistency across all endpoints

### API Endpoints Added

**Photo Likes**
- `POST /photos/:id/like` - Like a photo
- `DELETE /photos/:id/like` - Unlike a photo

**Ticket Management**
- `DELETE /tickets/:ticketNumber` - Cancel a ticket with reason tracking
- `DELETE /ticket-types/:id` - Smart deletion based on active tickets

### Technical Improvements

- Enhanced Ticket model with cancellation fields
- Photo model updated with likes tracking array
- Improved quantity_sold management for ticket types
- Better error messages with detailed context

### Documentation

- Complete README rewrite with comprehensive API documentation
- Detailed endpoint tables with HTTP methods and descriptions
- Enhanced examples for all major features
- Security and architecture documentation improvements

### Installation

```bash
git clone https://github.com/Xoriax/api_msn_tp.git
cd api_msn_tp
npm install
```

### Quick Start

1. Configure your `.env` file with MongoDB URI and JWT secret
2. Run `npm run dev` for development or `npm start` for production
3. API will be available at `http://localhost:3000`

### Full Feature Set

- JWT Authentication with bcrypt security
- Complete event management with participant tracking
- Group system (public/private/secret)
- Discussion threads with messaging
- Poll system with voting capabilities
- Photo albums with likes and comments
- Integrated ticketing system with purchase tracking
- Advanced cancellation and refund management