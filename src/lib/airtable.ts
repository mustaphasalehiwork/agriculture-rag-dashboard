import Airtable from 'airtable';

// Airtable configuration
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

// Table IDs
export const AIRTABLE_TABLES = {
  CATEGORIES: 'tblA9iBTbZI10UbGC',
  ACTIVITIES: 'tbl9Yz5DMdfb3934',
  MODELS: 'tbld0Hp8dC5YyYoWJ',
  CHECKLISTS: 'tblr7g1ch8DBbgXMU',
  USERS: 'tblspW9TtoXegOPMH'
};

function createAirtableClient() {
  if (!AIRTABLE_API_KEY) {
    throw new Error("Missing Airtable API key. Please check your .env.local file.");
  }

  return new Airtable({
    apiKey: AIRTABLE_API_KEY
  });
}

// Lazy initialization - create client only when needed
let airtableClient: any = null;

export function getAirtableClient() {
  if (!airtableClient) {
    airtableClient = createAirtableClient();
  }
  return airtableClient;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

export async function getRecordsFromTable(tableId: string): Promise<AirtableRecord[]> {
  const airtable = getAirtableClient();

  try {
    const records = await airtable
      .base(AIRTABLE_BASE_ID || 'appSFfG3TTY5qFRyr')
      .table(tableId)
      .select()
      .firstPage();

    return records;
  } catch (error) {
    console.error(`Failed to fetch records from table ${tableId}:`, error);
    throw error;
  }
}

export async function getTableStats(tableId: string): Promise<number> {
  try {
    const records = await getRecordsFromTable(tableId);
    return records.length;
  } catch (error) {
    console.error(`Failed to get stats for table ${tableId}:`, error);
    return 0;
  }
}

export async function getAllTablesStats() {
  try {
    const [categories, activities, models, checklists, users] = await Promise.all([
      getTableStats(AIRTABLE_TABLES.CATEGORIES),
      getTableStats(AIRTABLE_TABLES.ACTIVITIES),
      getTableStats(AIRTABLE_TABLES.MODELS),
      getTableStats(AIRTABLE_TABLES.CHECKLISTS),
      getTableStats(AIRTABLE_TABLES.USERS)
    ]);

    return {
      categories,
      activities,
      models,
      checklists,
      users
    };
  } catch (error) {
    console.error('Failed to get all tables stats:', error);
    throw error;
  }
}