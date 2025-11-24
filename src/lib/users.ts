// User storage - keeping it simple with in-memory storage for now
// TODO: Replace with a real database later

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Storing users in memory for now (will reset when server restarts)
let serverUsers: User[] = [
  {
    id: "1",
    email: "demo@academiahub.com",
    password: "demo123",
    name: "Demo User",
  },
  {
    id: "2",
    email: "admin@academiahub.com",
    password: "admin123",
    name: "Admin User",
  },
];

export function getAllUsers(): User[] {
  return serverUsers;
}

export function getUserByEmail(email: string): User | undefined {
  return serverUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: Omit<User, "id">): User {
  const newUser: User = {
    ...user,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  serverUsers.push(newUser);
  return newUser;
}

export function userExists(email: string): boolean {
  return serverUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id">>
): User {
  const userIndex = serverUsers.findIndex((u) => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error("User not found");
  }

  serverUsers[userIndex] = {
    ...serverUsers[userIndex],
    ...updates,
  };

  return serverUsers[userIndex];
}

