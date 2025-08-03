import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { breweries } from '../shared/schema';
import { eq, ilike } from 'drizzle-orm';

// Read and parse the brewery logos CSV file
const csvContent = readFileSync('../attached_assets/Breweries (2)_1754260704812.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

interface BreweryLogo {
  Name: string;
  Logo: string;
}

async function updateBreweryLogos() {
  console.log(`Processing ${records.length} brewery logo entries...`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const record of records as BreweryLogo[]) {
    const breweryName = record.Name.trim();
    const logoUrl = record.Logo.trim();
    
    try {
      // Find the brewery by name (case-insensitive search)
      const existingBreweries = await db
        .select()
        .from(breweries)
        .where(eq(breweries.name, breweryName));
      
      if (existingBreweries.length > 0) {
        // Update the brewery with the logo URL
        await db
          .update(breweries)
          .set({ logo: logoUrl })
          .where(eq(breweries.name, breweryName));
        
        console.log(`✓ Updated logo for: ${breweryName}`);
        updatedCount++;
      } else {
        // Try to find similar names (in case of slight variations)
        const allBreweries = await db.select().from(breweries);
        const similarBrewery = allBreweries.find(b => 
          b.name.toLowerCase().includes(breweryName.toLowerCase()) ||
          breweryName.toLowerCase().includes(b.name.toLowerCase())
        );
        
        if (similarBrewery) {
          await db
            .update(breweries)
            .set({ logo: logoUrl })
            .where(eq(breweries.id, similarBrewery.id));
          
          console.log(`✓ Updated logo for similar match: ${breweryName} -> ${similarBrewery.name}`);
          updatedCount++;
        } else {
          console.log(`✗ Brewery not found: ${breweryName}`);
          notFoundCount++;
        }
      }
    } catch (error) {
      console.error(`Error updating ${breweryName}:`, error);
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- Updated: ${updatedCount} breweries`);
  console.log(`- Not found: ${notFoundCount} breweries`);
  console.log(`- Total processed: ${records.length} entries`);
}

// Run the update script
updateBreweryLogos()
  .then(() => {
    console.log('Brewery logo update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating brewery logos:', error);
    process.exit(1);
  });