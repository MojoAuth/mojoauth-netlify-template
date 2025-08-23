# MojoAuth Hosted Login Page Implementation Guide

This guide provides implementation documentation for integrating MojoAuth's Hosted Login Page using the standard OIDC flow across various frameworks and programming languages.

## Table of Contents

1. [React](#react)
2. [Next.js](#nextjs)
3. [Node.js (Express)](#nodejs-express)
4. [Golang](#golang)
5. [Django (Python)](#django-python)
6. [Spring Boot (Java)](#spring-boot-java)

---

## React

### Introduction

React is a popular JavaScript library for building user interfaces, particularly single-page applications. This guide will show you how to integrate MojoAuth's hosted login page with a React application using the standard OIDC flow.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [react-oidc-context Documentation](https://github.com/authts/react-oidc-context)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Node.js v16+
- React v16.8+ (with Hooks support)

### Install OIDC Library

```bash
npm install react-oidc-context
```

### Configure Environment Variables

Create a `.env` file in your project root:

```
REACT_APP_MOJOAUTH_CLIENT_ID=your-client-id
REACT_APP_MOJOAUTH_AUTHORITY=https://api.mojoauth.com
REACT_APP_MOJOAUTH_REDIRECT_URI=http://localhost:3000/callback
```

### Initialize OIDC Client

Create an `AuthProvider` component to wrap your application:

```jsx
// src/AuthProvider.jsx
import React from 'react';
import { AuthProvider } from 'react-oidc-context';

const oidcConfig = {
  authority: process.env.REACT_APP_MOJOAUTH_AUTHORITY,
  client_id: process.env.REACT_APP_MOJOAUTH_CLIENT_ID,
  redirect_uri: process.env.REACT_APP_MOJOAUTH_REDIRECT_URI,
  response_type: 'code',
  scope: 'openid profile email',
};

export const OidcProvider = ({ children }) => {
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
};
```

Then wrap your app in `index.js`:

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { OidcProvider } from './AuthProvider';

ReactDOM.render(
  <OidcProvider>
    <App />
  </OidcProvider>,
  document.getElementById('root')
);
```

### Create Login Component

```jsx
// src/components/Login.jsx
import React from 'react';
import { useAuth } from 'react-oidc-context';

const Login = () => {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect();
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Error: {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <p>You are logged in!</p>
        <button onClick={() => auth.signoutRedirect()}>Log out</button>
      </div>
    );
  }

  return <button onClick={handleLogin}>Login with MojoAuth</button>;
};

export default Login;
```

### Handle Callback

Add a callback route in your app:

```jsx
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/callback" component={() => <div>Loading...</div>} />
        <Route path="/profile" component={Profile} />
        <Route path="/" component={Login} />
      </Switch>
    </Router>
  );
}

export default App;
```

### User Profile Component

```jsx
// src/components/Profile.jsx
import React from 'react';
import { useAuth } from 'react-oidc-context';
import { Redirect } from 'react-router-dom';

const Profile = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Error: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div>
      <h1>User Profile</h1>
      <img src={auth.user?.profile.picture} alt="Profile" />
      <p>Name: {auth.user?.profile.name}</p>
      <p>Email: {auth.user?.profile.email}</p>
      <button onClick={() => auth.signoutRedirect()}>Log out</button>
    </div>
  );
};

export default Profile;
```

### Testing the Flow

1. Start the development server: `npm start`
2. Open http://localhost:3000
3. Click "Login with MojoAuth"
4. Complete authentication on MojoAuth's hosted login page
5. You'll be redirected back to your application with user information

---

## Next.js

### Introduction

Next.js is a React framework that enables server-side rendering and other advanced features. This guide will help you integrate MojoAuth's hosted login page with a Next.js application.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Node.js v16+
- Next.js v12+

### Install OIDC Library

```bash
npm install next-auth
```

### Configure Environment Variables

Create a `.env.local` file in your project root:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-string-here

MOJOAUTH_CLIENT_ID=your-client-id
MOJOAUTH_CLIENT_SECRET=your-client-secret
MOJOAUTH_ISSUER=https://api.mojoauth.com
```

### Initialize OIDC Client

Create the NextAuth.js configuration:

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import { OIDCProvider } from "next-auth/providers";

export default NextAuth({
  providers: [
    OIDCProvider({
      name: 'MojoAuth',
      id: 'mojoauth',
      clientId: process.env.MOJOAUTH_CLIENT_ID,
      clientSecret: process.env.MOJOAUTH_CLIENT_SECRET,
      issuer: process.env.MOJOAUTH_ISSUER,
      wellKnown: `${process.env.MOJOAUTH_ISSUER}/.well-known/openid-configuration`,
      authorization: {
        params: { scope: "openid email profile" }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    }
  }
});
```

### Create Login Component

```jsx
// components/LoginButton.js
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      <button onClick={() => signIn("mojoauth")}>Sign in with MojoAuth</button>
    </>
  );
}
```

### Configure App with Session Provider

```jsx
// pages/_app.js
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
```

### Create Protected Profile Page

```jsx
// pages/profile.js
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import LoginButton from "../components/LoginButton";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You need to sign in to view this page.</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome {session.user.name || session.user.email}</p>
      <img src={session.user.image} alt="Profile" width="100" height="100" />
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <LoginButton />
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  return {
    props: { session }
  };
}
```

### Testing the Flow

1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Click "Sign in with MojoAuth"
4. Complete authentication on MojoAuth's hosted login page
5. You'll be redirected back to your application with user information

---

## Node.js (Express)

### Introduction

This guide shows how to implement MojoAuth's hosted login page with a Node.js Express application.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [openid-client Documentation](https://github.com/panva/node-openid-client)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Node.js v16+
- Express.js

### Install OIDC Library

```bash
npm install express openid-client express-session
```

### Configure Environment Variables

Create a `.env` file:

```
MOJOAUTH_CLIENT_ID=your-client-id
MOJOAUTH_CLIENT_SECRET=your-client-secret
MOJOAUTH_ISSUER=https://api.mojoauth.com
MOJOAUTH_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=your-random-string-here
```

### Initialize OIDC Client

```javascript
// app.js
const express = require('express');
const session = require('express-session');
const { Issuer, Strategy } = require('openid-client');
const passport = require('passport');
require('dotenv').config();

const app = express();

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport session serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Set up views
app.set('view engine', 'ejs');

// Initialize OIDC client
let client;
async function setupAuth() {
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER);
    client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI],
      response_types: ['code']
    });

    const strategy = new Strategy({ 
      client,
      params: {
        scope: 'openid email profile'
      }
    }, (tokenSet, userInfo, done) => {
      return done(null, {
        tokenSet,
        userInfo
      });
    });

    passport.use('oidc', strategy);
  } catch (error) {
    console.error('Error setting up authentication:', error);
  }
}

setupAuth();
```

### Create Login Endpoint

```javascript
// Routes for authentication
app.get('/login', passport.authenticate('oidc'));

app.get('/callback', passport.authenticate('oidc', {
  successRedirect: '/profile',
  failureRedirect: '/error'
}));

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
```

### Handle Profile Route

```javascript
// Profile page - protected route
app.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user.userInfo });
});

// Home page
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// Error page
app.get('/error', (req, res) => {
  res.render('error');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Create Views

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MojoAuth Demo</title>
</head>
<body>
  <h1>MojoAuth OIDC Demo</h1>
  <% if (user) { %>
    <p>You are logged in</p>
    <a href="/profile">View Profile</a>
    <a href="/logout">Logout</a>
  <% } else { %>
    <a href="/login">Login with MojoAuth</a>
  <% } %>
</body>
</html>
```

```html
<!-- views/profile.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile</title>
</head>
<body>
  <h1>User Profile</h1>
  <% if (user) { %>
    <img src="<%= user.picture %>" alt="Profile Picture">
    <p>Name: <%= user.name %></p>
    <p>Email: <%= user.email %></p>
    <p>User ID: <%= user.sub %></p>
    <a href="/logout">Logout</a>
  <% } else { %>
    <p>Not logged in</p>
    <a href="/login">Login</a>
  <% } %>
</body>
</html>
```

### Testing the Flow

1. Start the server: `node app.js`
2. Open http://localhost:3000
3. Click "Login with MojoAuth"
4. Complete authentication on MojoAuth's hosted login page
5. You'll be redirected back to your profile page with user information

---

## Golang

### Introduction

This guide demonstrates how to integrate MojoAuth's hosted login page with a Go application using the standard OIDC flow.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [go-oidc Documentation](https://github.com/coreos/go-oidc)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Go 1.16+

### Install OIDC Library

```bash
go get github.com/coreos/go-oidc/v3/oidc
go get golang.org/x/oauth2
```

### Configure Environment Variables

```go
// Set these environment variables or load from a config file
// MOJOAUTH_CLIENT_ID=your-client-id
// MOJOAUTH_CLIENT_SECRET=your-client-secret
// MOJOAUTH_REDIRECT_URI=http://localhost:8080/callback
```

### Initialize OIDC Client

```go
// main.go
package main

import (
	"context"
	"encoding/gob"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

var (
	clientID     = os.Getenv("MOJOAUTH_CLIENT_ID")
	clientSecret = os.Getenv("MOJOAUTH_CLIENT_SECRET")
	redirectURI  = os.Getenv("MOJOAUTH_REDIRECT_URI")
	provider     *oidc.Provider
	oauth2Config oauth2.Config
	ctx          = context.Background()
)

func init() {
	// Register the UserInfo type with gob for session storage
	gob.Register(map[string]interface{}{})
}

func main() {
	// Initialize OIDC provider
	var err error
	provider, err = oidc.NewProvider(ctx, "https://api.mojoauth.com")
	if err != nil {
		log.Fatalf("Failed to initialize OIDC provider: %v", err)
	}

	// Configure OAuth2
	oauth2Config = oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURI,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	// Setup routes
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/callback", callbackHandler)
	http.HandleFunc("/profile", profileHandler)
	http.HandleFunc("/logout", logoutHandler)

	// Start server
	fmt.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Create Login Endpoint

```go
func loginHandler(w http.ResponseWriter, r *http.Request) {
	// Generate a random state value
	state := generateRandomState()
	
	// Store state in session
	session, _ := store.Get(r, "auth-session")
	session.Values["state"] = state
	session.Save(r, w)
	
	// Redirect to auth page
	http.Redirect(w, r, oauth2Config.AuthCodeURL(state), http.StatusFound)
}

func generateRandomState() string {
	// Generate a random state string
	// Implementation omitted for brevity
	return "randomstate123"
}

// Initialize session store
var store = sessions.NewCookieStore([]byte("something-very-secret"))
```

### Handle Callback

```go
func callbackHandler(w http.ResponseWriter, r *http.Request) {
	// Get state from session and compare
	session, _ := store.Get(r, "auth-session")
	sessionState, ok := session.Values["state"].(string)
	if !ok || sessionState != r.URL.Query().Get("state") {
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	// Exchange code for token
	oauth2Token, err := oauth2Config.Exchange(ctx, r.URL.Query().Get("code"))
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Extract ID token
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		http.Error(w, "No id_token found in OAuth2 token", http.StatusInternalServerError)
		return
	}

	// Verify ID token
	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})
	idToken, err := verifier.Verify(ctx, rawIDToken)
	if err != nil {
		http.Error(w, "Failed to verify ID Token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Extract user info
	var userInfo map[string]interface{}
	if err := idToken.Claims(&userInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store user info in session
	session.Values["userInfo"] = userInfo
	session.Values["access_token"] = oauth2Token.AccessToken
	session.Save(r, w)

	// Redirect to profile
	http.Redirect(w, r, "/profile", http.StatusFound)
}
```

### User Profile Handler

```go
func profileHandler(w http.ResponseWriter, r *http.Request) {
	// Get user info from session
	session, _ := store.Get(r, "auth-session")
	userInfo, ok := session.Values["userInfo"].(map[string]interface{})
	if !ok {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	// Display user profile
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, "<h1>User Profile</h1>")
	fmt.Fprintf(w, "<img src='%s' alt='Profile Picture'>", userInfo["picture"])
	fmt.Fprintf(w, "<p>Name: %s</p>", userInfo["name"])
	fmt.Fprintf(w, "<p>Email: %s</p>", userInfo["email"])
	fmt.Fprintf(w, "<p>User ID: %s</p>", userInfo["sub"])
	fmt.Fprintf(w, "<a href='/logout'>Logout</a>")
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	// Get user info from session
	session, _ := store.Get(r, "auth-session")
	userInfo, ok := session.Values["userInfo"].(map[string]interface{})
	
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, "<h1>MojoAuth OIDC Demo</h1>")
	
	if ok {
		fmt.Fprintf(w, "<p>You are logged in</p>")
		fmt.Fprintf(w, "<a href='/profile'>View Profile</a><br>")
		fmt.Fprintf(w, "<a href='/logout'>Logout</a>")
	} else {
		fmt.Fprintf(w, "<a href='/login'>Login with MojoAuth</a>")
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	// Clear session
	session, _ := store.Get(r, "auth-session")
	session.Values = map[interface{}]interface{}{}
	session.Save(r, w)
	
	http.Redirect(w, r, "/", http.StatusFound)
}
```

### Testing the Flow

1. Set environment variables for MOJOAUTH_CLIENT_ID, MOJOAUTH_CLIENT_SECRET, and MOJOAUTH_REDIRECT_URI
2. Start the server: `go run main.go`
3. Open http://localhost:8080
4. Click "Login with MojoAuth"
5. Complete authentication on MojoAuth's hosted login page
6. You'll be redirected back to your profile page with user information

---

## Django (Python)

### Introduction

This guide demonstrates how to integrate MojoAuth's hosted login page with a Django application using the standard OIDC flow.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [mozilla-django-oidc Documentation](https://mozilla-django-oidc.readthedocs.io/)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Python 3.8+
- Django 3.2+

### Install OIDC Library

```bash
pip install mozilla-django-oidc
```

### Configure Environment Variables

Create a `.env` file:

```
MOJOAUTH_CLIENT_ID=your-client-id
MOJOAUTH_CLIENT_SECRET=your-client-secret
MOJOAUTH_ISSUER=https://api.mojoauth.com
```

### Configure Django Settings

Update your settings.py file:

```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file

INSTALLED_APPS = [
    # ... other apps
    'mozilla_django_oidc',  # Load this app
]

MIDDLEWARE = [
    # ... other middleware
    'mozilla_django_oidc.middleware.SessionRefresh',
]

AUTHENTICATION_BACKENDS = (
    'mozilla_django_oidc.auth.OIDCAuthenticationBackend',
    # ... other auth backends
)

# OIDC Configuration
OIDC_RP_CLIENT_ID = os.getenv('MOJOAUTH_CLIENT_ID')
OIDC_RP_CLIENT_SECRET = os.getenv('MOJOAUTH_CLIENT_SECRET')
OIDC_OP_AUTHORIZATION_ENDPOINT = f"{os.getenv('MOJOAUTH_ISSUER')}/authorize"
OIDC_OP_TOKEN_ENDPOINT = f"{os.getenv('MOJOAUTH_ISSUER')}/token"
OIDC_OP_USER_ENDPOINT = f"{os.getenv('MOJOAUTH_ISSUER')}/userinfo"
OIDC_OP_JWKS_ENDPOINT = f"{os.getenv('MOJOAUTH_ISSUER')}/.well-known/jwks.json"

# OIDC Flow settings
OIDC_AUTHENTICATION_CALLBACK_URL = "oidc_authentication_callback"
OIDC_RP_SIGN_ALGO = "RS256"
OIDC_USE_NONCE = True
OIDC_STORE_ACCESS_TOKEN = True
OIDC_STORE_ID_TOKEN = True
```

### Configure URLs

Update your urls.py:

```python
# urls.py
from django.urls import path, include
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('profile/', login_required(views.profile), name='profile'),
    path('oidc/', include('mozilla_django_oidc.urls')),
]
```

### Create Views

```python
# views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from mozilla_django_oidc.auth import OIDCAuthenticationBackend

def home(request):
    return render(request, 'home.html')

@login_required
def profile(request):
    user = request.user
    try:
        # Get additional user info from session if available
        access_token = request.session.get('oidc_access_token')
        id_token = request.session.get('oidc_id_token')
        
        # You can add additional profile data retrieval here if needed
        
    except Exception as e:
        print(f"Error getting profile: {e}")
    
    return render(request, 'profile.html', {'user': user})
```

### Extend OIDC Authentication Backend

```python
# auth.py
from mozilla_django_oidc.auth import OIDCAuthenticationBackend

class CustomOIDCAuthenticationBackend(OIDCAuthenticationBackend):
    def create_user(self, claims):
        """Override this method to customize user creation."""
        user = super().create_user(claims)
        # Add custom fields if needed
        user.first_name = claims.get('given_name', '')
        user.last_name = claims.get('family_name', '')
        user.save()
        return user

    def update_user(self, user, claims):
        """Override this method to customize user updates."""
        user.first_name = claims.get('given_name', '')
        user.last_name = claims.get('family_name', '')
        user.save()
        return user
```

### Create Templates

```html
<!-- templates/home.html -->
<!DOCTYPE html>
<html>
<head>
    <title>MojoAuth Demo</title>
</head>
<body>
    <h1>MojoAuth OIDC Demo</h1>
    {% if user.is_authenticated %}
        <p>You are logged in as {{ user.username }}</p>
        <a href="{% url 'profile' %}">View Profile</a><br>
        <a href="{% url 'oidc_logout' %}">Logout</a>
    {% else %}
        <a href="{% url 'oidc_authentication_init' %}">Login with MojoAuth</a>
    {% endif %}
</body>
</html>
```

```html
<!-- templates/profile.html -->
<!DOCTYPE html>
<html>
<head>
    <title>User Profile</title>
</head>
<body>
    <h1>User Profile</h1>
    <p>Username: {{ user.username }}</p>
    <p>Email: {{ user.email }}</p>
    <p>Name: {{ user.first_name }} {{ user.last_name }}</p>
    
    <a href="{% url 'home' %}">Home</a>
    <a href="{% url 'oidc_logout' %}">Logout</a>
</body>
</html>
```

### Testing the Flow

1. Start the Django development server: `python manage.py runserver`
2. Open http://localhost:8000
3. Click "Login with MojoAuth"
4. Complete authentication on MojoAuth's hosted login page
5. You'll be redirected back to your application with user information

---

## Spring Boot (Java)

### Introduction

This guide demonstrates how to integrate MojoAuth's hosted login page with a Spring Boot application using the standard OIDC flow.

**Links:**
- [MojoAuth Hosted Login Page Docs](https://docs.mojoauth.com/hosted-login-page/)
- [Spring Security OAuth2 Documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)

### Prerequisites

- MojoAuth account & OIDC application setup
- Client ID, Client Secret, Redirect URI
- Java 11+
- Spring Boot 2.6+
- Maven or Gradle

### Install OIDC Library

Add to your pom.xml (Maven):

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.thymeleaf.extras</groupId>
        <artifactId>thymeleaf-extras-springsecurity5</artifactId>
    </dependency>
</dependencies>
```

Or build.gradle (Gradle):

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.thymeleaf.extras:thymeleaf-extras-springsecurity5'
}
```

### Configure Environment Variables

Add to your application.properties or application.yml:

```properties
# application.properties
spring.security.oauth2.client.registration.mojoauth.client-id=${MOJOAUTH_CLIENT_ID}
spring.security.oauth2.client.registration.mojoauth.client-secret=${MOJOAUTH_CLIENT_SECRET}
spring.security.oauth2.client.registration.mojoauth.redirect-uri={baseUrl}/login/oauth2/code/mojoauth
spring.security.oauth2.client.registration.mojoauth.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.mojoauth.scope=openid,profile,email

# MojoAuth provider details
spring.security.oauth2.client.provider.mojoauth.issuer-uri=https://api.mojoauth.com
spring.security.oauth2.client.provider.mojoauth.user-name-attribute=sub
```

### Configure Security

```java
// SecurityConfig.java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.web.SecurityFilterChain;

import java.util.HashSet;
import java.util.Set;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeRequests(authorizeRequests ->
                authorizeRequests
                    .antMatchers("/", "/error", "/webjars/**").permitAll()
                    .anyRequest().authenticated()
            )
            .oauth2Login(oauth2Login ->
                oauth2Login
                    .loginPage("/oauth2/authorization/mojoauth")
                    .defaultSuccessUrl("/profile", true)
            )
            .logout(logout ->
                logout
                    .logoutSuccessUrl("/")
                    .permitAll()
            );
        return http.build();
    }

    @Bean
    public GrantedAuthoritiesMapper userAuthoritiesMapper() {
        return (authorities) -> {
            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();
            
            authorities.forEach(authority -> {
                if (authority instanceof OidcUserAuthority) {
                    OidcUserAuthority oidcUserAuthority = (OidcUserAuthority) authority;
                    mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    
                    // You can extract additional roles from claims if needed
                    
                } else if (authority instanceof OAuth2UserAuthority) {
                    OAuth2UserAuthority oauth2UserAuthority = (OAuth2UserAuthority) authority;
                    mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                }
            });
            
            return mappedAuthorities;
        };
    }
}
```

### Create Controllers

```java
// HomeController.java
package com.example.demo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "home";
    }

    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal OidcUser oidcUser, Model model) {
        model.addAttribute("user", oidcUser);
        return "profile";
    }
}
```

### Create Templates

```html
<!-- templates/home.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
    <title>MojoAuth Demo</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>MojoAuth OIDC Demo</h1>
    <div sec:authorize="isAuthenticated()">
        <p>You are logged in as <span sec:authentication="name"></span></p>
        <a th:href="@{/profile}">View Profile</a><br>
        <form th:action="@{/logout}" method="post">
            <button type="submit">Logout</button>
        </form>
    </div>
    <div sec:authorize="!isAuthenticated()">
        <a th:href="@{/oauth2/authorization/mojoauth}">Login with MojoAuth</a>
    </div>
</body>
</html>
```

```html
<!-- templates/profile.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
    <title>User Profile</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>User Profile</h1>
    <div th:if="${user != null}">
        <img th:if="${user.getPicture() != null}" th:src="${user.getPicture()}" alt="Profile Picture">
        <p>Name: <span th:text="${user.getFullName()}"></span></p>
        <p>Email: <span th:text="${user.getEmail()}"></span></p>
        <p>Subject: <span th:text="${user.getSubject()}"></span></p>
        
        <h2>Claims</h2>
        <table>
            <tr th:each="claim : ${user.getClaims()}">
                <td th:text="${claim.key}"></td>
                <td th:text="${claim.value}"></td>
            </tr>
        </table>
    </div>
    
    <a th:href="@{/}">Home</a>
    <form th:action="@{/logout}" method="post">
        <button type="submit">Logout</button>
    </form>
</body>
</html>
```

### Testing the Flow

1. Set environment variables for MOJOAUTH_CLIENT_ID and MOJOAUTH_CLIENT_SECRET
2. Start the Spring Boot application: `./mvnw spring-boot:run` or `./gradlew bootRun`
3. Open http://localhost:8080
4. Click "Login with MojoAuth"
5. Complete authentication on MojoAuth's hosted login page
6. You'll be redirected back to your application with user information
