import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

interface CSVUser {
  email: string;
  username: string;
  photo: string;
  master_admin: string;
  brewery_owner: string;
  checkins: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  location?: string;
  checkins: number;
  favoriteBreweries: string[];
  isAdmin: boolean;
  isBreweryOwner: boolean;
}

function parseCSV(csvContent: string): CSVUser[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const user: any = {};
    
    headers.forEach((header, index) => {
      user[header] = values[index] || '';
    });
    
    return user as CSVUser;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function convertToUser(csvUser: CSVUser, index: number): User {
  // Generate a proper ID based on email or use index
  const id = csvUser.email ? 
    csvUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + nanoid(4) : 
    `user${index + 1}`;
  
  // Handle profile image URLs
  let profileImage = csvUser.photo;
  if (profileImage && profileImage.includes('drive.google.com')) {
    // Convert Google Drive share links to direct image URLs
    const fileId = profileImage.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      profileImage = `https://drive.google.com/uc?id=${fileId}`;
    }
  }
  
  return {
    id,
    email: csvUser.email,
    username: csvUser.username || `User${index + 1}`,
    profileImage: profileImage || undefined,
    location: 'Oklahoma City, OK', // Default location since not in CSV
    checkins: parseInt(csvUser.checkins) || 0,
    favoriteBreweries: [], // Will be populated later based on check-ins
    isAdmin: csvUser.master_admin === 'TRUE',
    isBreweryOwner: csvUser.brewery_owner === 'TRUE'
  };
}

export function processUsersCSV(): User[] {
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'Users_1754189261860.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const csvUsers = parseCSV(csvContent);
    const users = csvUsers
      .filter(user => user.email && user.username) // Filter out incomplete entries
      .map((user, index) => convertToUser(user, index));
    
    console.log(`Processed ${users.length} users from CSV`);
    console.log(`Top users by check-ins:`, users
      .sort((a, b) => b.checkins - a.checkins)
      .slice(0, 10)
      .map(u => `${u.username}: ${u.checkins}`)
    );
    
    return users;
  } catch (error) {
    console.error('Error processing CSV:', error);
    return [];
  }
}

export function generateUserData(): User[] {
  const users = processUsersCSV();
  
  // Add some sample favorite breweries for users with check-ins
  const breweryIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  users.forEach(user => {
    if (user.checkins > 0) {
      // Add 1-3 favorite breweries for users with check-ins
      const numFavorites = Math.min(Math.floor(user.checkins / 20) + 1, 3);
      const shuffled = [...breweryIds].sort(() => Math.random() - 0.5);
      user.favoriteBreweries = shuffled.slice(0, numFavorites);
    }
  });
  
  return users;
}