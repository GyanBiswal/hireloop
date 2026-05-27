// app/api/auth/[...nextauth]/route.js
//
// This is the NextAuth.js "catch-all" API route.
// The filename [...nextauth] means it handles ALL of these URLs automatically:
//   POST /api/auth/signin      ← called when user submits login form
//   GET  /api/auth/session     ← called by useSession() to check who's logged in
//   POST /api/auth/signout     ← called when user clicks "Sign out"
//   GET  /api/auth/csrf        ← security token for forms
//
// NextAuth reads our `authOptions` config and handles all the above for us.
// We just need to define HOW to verify a user (CredentialsProvider)
// and WHAT to put in the session (callbacks).

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export const authOptions = {
  // --- PROVIDERS ---
  // Providers are the "methods" users can log in with.
  // We only use CredentialsProvider (email + password).
  // Other options would be GoogleProvider, GitHubProvider etc. — we skip those.
  providers: [
    CredentialsProvider({
      name: 'Credentials',

      // `credentials` defines the fields shown if you use NextAuth's built-in UI.
      // We use our own custom login page, so this is mostly for documentation.
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      // `authorize` is called when the user submits the login form.
      // It receives the form values. Return a user object on success, null on failure.
      async authorize(credentials) {
        // Guard: both fields must be present
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Look up the user in the database by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // If no user found, don't reveal whether the email exists (security best practice)
        if (!user) {
          throw new Error('Invalid email or password')
        }

        // bcrypt.compare() hashes the submitted password and compares it to
        // the stored hash. We NEVER store or compare plain-text passwords.
        const passwordMatch = await bcrypt.compare(credentials.password, user.password)

        if (!passwordMatch) {
          throw new Error('Invalid email or password')
        }

        // Return only what we want in the token — never return the password hash
        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role, // ADMIN | RECRUITER | INTERVIEWER
        }
      },
    }),
  ],

  // --- SESSION STRATEGY ---
  // "jwt" means the session is stored in a signed cookie on the CLIENT.
  // The alternative is "database" (session stored in a DB table).
  //
  // WHY JWT for this project:
  // - No extra DB query on every page load — the cookie already has the data
  // - Works perfectly with Next.js Edge middleware (which can't use Prisma)
  // - Stateless: the server doesn't need to "remember" sessions
  session: {
    strategy: 'jwt',
  },

  // --- CALLBACKS ---
  // Callbacks let us customise what goes into the JWT and session.
  callbacks: {
    // `jwt` is called whenever a JWT is CREATED (login) or READ (page load).
    // `token` = current JWT contents; `user` = returned from authorize() (only on login)
    async jwt({ token, user }) {
      if (user) {
        // On first login, `user` is the object returned by authorize() above.
        // We add id and role to the token so they're available everywhere.
        token.id   = user.id
        token.role = user.role
        // WHY store role in JWT:
        // The middleware runs at the Edge (a lightweight server with no DB access).
        // It needs to check the user's role to decide if they can visit /admin/*.
        // The only data available at the Edge is the JWT cookie — so role MUST be in it.
        // If role were only in the DB, every page load would need a DB query just to check auth.
      }
      return token
    },

    // `session` is called whenever a React component calls useSession() or
    // a server component calls getServerSession().
    // `session.user` is what gets returned to your app code.
    async session({ session, token }) {
      if (token) {
        // Copy id and role from the JWT into the session object
        // so you can do: session.user.id and session.user.role anywhere in the app
        session.user.id   = token.id
        session.user.role = token.role
      }
      return session
    },
  },

  // --- PAGES ---
  // Tell NextAuth to use OUR custom login page instead of its built-in one
  pages: {
    signIn: '/login',
  },

  // --- SECRET ---
  // Used to sign and encrypt the JWT cookie. Must match NEXTAUTH_SECRET in .env.
  // If this changes, all existing sessions are instantly invalidated.
  secret: process.env.NEXTAUTH_SECRET,
}

// NextAuth() returns two request handlers: GET and POST.
// We export both so Next.js App Router knows how to route requests to them.
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }