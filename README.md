# Watchify

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#Getting_Started)
- [Technologies used](#Technologies_used)

## 🧐 About

Welcome to Watchify – a robust backend solution providing essential features for video uploading and storage built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, etc. This RESTful API is designed to handle:

- **User Authentication:** Secure account creation, login, and identity verification.
- **Video Management:** Seamless video uploading and storage.
- **User Interaction:** Liking, disliking videos, commenting, tweeting and more.

## 🏁 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed on your machine:

- [NodeJs](https://nodejs.org/en/) : JavaScript runtime for server-side development.

### Installing

Follow these steps to set up the development environment:

#### 1. Clone the Repository:

```
git clone <https://github.com/desmond3th/backend.git>
cd backend
```
#### 2. Install Dependencies:

```
npm install
```
#### 3. Set Up Environment Variables:
create a ```.env``` file in the root directory and add the necessary variables.
```
PORT=3000
MONGODB_URL=your-mongodb-connection-string
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRY=your-access-token-expiry-time
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=your-refresh-token-expiry-time
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

```
#### 4. Run the Development Server:

```
npm run dev
```

## ⛏️ Technologies used 

- [MongoDB](https://www.mongodb.com/) - Database
- [Express](https://expressjs.com/) - Server Framework
- [NodeJs](https://nodejs.org/en/) - Server Environment
- [Cloudinary](https://cloudinary.com/) - Cloud



