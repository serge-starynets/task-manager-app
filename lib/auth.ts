import { compare, hash } from 'bcrypt'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { users } from '@/db/schema'
import * as jose from 'jose'
import { cache } from 'react'
import { SESSION_MAX_AGE_SECONDS } from '@/lib/auth-constants'

// JWT types
interface JWTPayload {
    userId: string
    [key: string]: string | number | boolean | null | undefined
}

// Secret key for JWT signing (in a real app, use an environment variable)
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

// Hash a password
export async function hashPassword(password: string) {
    return hash(password, 10)
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string) {
    return compare(password, hashedPassword)
}

// Create a new user
export async function createUser(email: string, password: string) {
    const hashedPassword = await hashPassword(password)
    const id = nanoid()

    try {
        await db.insert(users).values({
            id,
            email,
            password: hashedPassword,
        })

        return { id, email }
    } catch (error) {
        console.error('Error creating user:', error)
        return null
    }
}

// Generate a JWT token (expires after idle window)
export async function generateJWT(payload: JWTPayload) {
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
        .sign(JWT_SECRET)
}

// Verify a JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET)
        return payload as JWTPayload
    } catch (error) {
        console.error('JWT verification failed:', error)
        return null
    }
}

function sessionCookieOptions(token: string) {
    return {
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax' as const,
    }
}

// Create a session using JWT
export async function createSession(userId: string) {
    try {
        const token = await generateJWT({ userId })
        const cookieStore = await cookies()
        cookieStore.set(sessionCookieOptions(token))
        return true
    } catch (error) {
        console.error('Error creating session:', error)
        return false
    }
}

/**
 * Re-issue the session cookie if the current token is still valid.
 * Used to slide the idle window while the user is active.
 */
export async function refreshSession(): Promise<boolean> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        if (!token) return false

        const payload = await verifyJWT(token)
        if (!payload?.userId) return false

        const nextToken = await generateJWT({ userId: payload.userId })
        cookieStore.set(sessionCookieOptions(nextToken))
        return true
    } catch (error) {
        console.error('Error refreshing session:', error)
        return false
    }
}

// Get current session from JWT
export const getSession = cache(async () => {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) return null
        const payload = await verifyJWT(token)

        return payload ? { userId: payload.userId } : null
    } catch (error) {
        // Handle the specific prerendering error
        if (
            error instanceof Error &&
            error.message.includes('During prerendering, `cookies()` rejects')
        ) {
            console.log(
                'Cookies not available during prerendering, returning null session'
            )
            return null
        }

        console.error('Error getting session:', error)
        return null
    }
})

// Delete session by clearing the JWT cookie
export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
}
