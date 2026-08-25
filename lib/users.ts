import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/password';

export async function getUserByEmail(email: string) {
  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const id = nanoid();

  try {
    await db.insert(users).values({
      id,
      email,
      password: hashedPassword,
    });

    return { id, email };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}
