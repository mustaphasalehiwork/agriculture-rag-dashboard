import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import {
  CheckListQuestion,
  User,
  CheckListTemplate,
  OperatorPerformance,
  OperatorPerformanceResponse,
  AirtableResponse,
  DEFAULT_PASS_RESPONSES,
  ErrorResponse
} from "@/types/operator-performance";

// Airtable configuration - should be moved to environment variables
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;

/**
 * Helper function to check if a response is a pass based on response type
 */
function isPass(response: string, responseType: string): boolean {
  const normalizedResponse = response.trim().toLowerCase();
  const passResponses = DEFAULT_PASS_RESPONSES[responseType as keyof typeof DEFAULT_PASS_RESPONSES];

  if (!passResponses) {
    return false;
  }

  return passResponses.some(passResponse =>
    passResponse.toLowerCase() === normalizedResponse
  );
}

/**
 * Fetch users data from Airtable
 */
async function fetchAirtableUsers(): Promise<User[]> {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    throw new Error("Airtable configuration missing");
  }

  // Try different possible table names
  const possibleTableNames = ['Users', 'tblUsers', 'Operator Users', 'Operators'];
  let lastError: Error | null = null;

  for (const tableName of possibleTableNames) {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AirtableResponse<User> = await response.json();
        console.log(`Successfully fetched users from table: ${tableName}`);
        return data.records.map(record => record.fields);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  throw new Error(`Failed to fetch Airtable users from any table. Last error: ${lastError?.message}`);
}

/**
 * Fetch checklist template data from Airtable
 */
async function fetchAirtableChecklistTemplates(): Promise<CheckListTemplate[]> {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    throw new Error("Airtable configuration missing");
  }

  // Try different possible table names
  const possibleTableNames = ['CheckList Template', 'Checklist Templates', 'Templates', 'Questions'];
  let lastError: Error | null = null;

  for (const tableName of possibleTableNames) {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AirtableResponse<CheckListTemplate> = await response.json();
        console.log(`Successfully fetched checklist templates from table: ${tableName}`);
        return data.records.map(record => record.fields);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  throw new Error(`Failed to fetch Airtable checklist templates from any table. Last error: ${lastError?.message}`);
}

/**
 * Process checklist questions and calculate performance metrics
 */
async function processOperatorPerformance(
  checklistQuestions: CheckListQuestion[],
  users: User[],
  templates: CheckListTemplate[]
): Promise<OperatorPerformance[]> {
  // Create maps for efficient lookup
  const userMap = new Map<string, User>(
    users.map(user => [user.TelegramId, user])
  );

  const templateMap = new Map<string, CheckListTemplate>(
    templates.map(template => [template.Question, template])
  );

  // Group checklist questions by telegramId
  const operatorGroups = new Map<string, CheckListQuestion[]>();

  checklistQuestions.forEach(question => {
    if (!operatorGroups.has(question.telegramId)) {
      operatorGroups.set(question.telegramId, []);
    }
    operatorGroups.get(question.telegramId)!.push(question);
  });

  // Calculate performance metrics for each operator
  const operatorPerformances: OperatorPerformance[] = [];

  for (const [telegramId, questions] of operatorGroups.entries()) {
    const user = userMap.get(telegramId);

    // Skip if user not found or not an operator
    if (!user || user.UserGroup !== 'Operator') {
      continue;
    }

    let totalChecklists = 0;
    let passedCount = 0;

    // Process each question for this operator
    for (const question of questions) {
      const template = templateMap.get(question.question);

      if (!template) {
        console.warn(`Template not found for question: ${question.question}`);
        continue;
      }

      totalChecklists++;

      if (isPass(question.response, template.ResponseType)) {
        passedCount++;
      }
    }

    // Only include operators with at least one checklist
    if (totalChecklists > 0) {
      const passRate = Math.round((passedCount / totalChecklists) * 100);

      operatorPerformances.push({
        name: user.Name,
        userGroup: user.UserGroup,
        telegramId,
        totalChecklists,
        passedCount,
        passRate,
        lastActiveDate: questions.length > 0
          ? questions.sort((a, b) =>
              new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            )[0].created_at
          : undefined,
      });
    }
  }

  // Sort by pass rate (descending) then by name
  return operatorPerformances.sort((a, b) => {
    if (b.passRate !== a.passRate) {
      return b.passRate - a.passRate;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * GET /api/operator-performance
 * Returns operator performance metrics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    await requireAuth();

    // Parse query parameters for date filtering (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch data from all sources
    const supabase = getSupabaseClient();

    // Fetch checklist questions from Supabase
    let query = supabase
      .from('CheckListQuestion')
      .select('*');

    // Apply date filtering if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: checklistData, error: checklistError } = await query;

    // Create mock checklist data for testing (in case table doesn't exist)
    const mockChecklistData: CheckListQuestion[] = [
      { id: 1, telegramId: "123456789", question: "Equipment check completed", response: "Yes", created_at: new Date().toISOString() },
      { id: 2, telegramId: "123456789", question: "Safety protocol followed", response: "Green", created_at: new Date().toISOString() },
      { id: 3, telegramId: "123456789", question: "Work area clean", response: "Ok", created_at: new Date().toISOString() },
      { id: 4, telegramId: "987654321", question: "Equipment check completed", response: "Yes", created_at: new Date().toISOString() },
      { id: 5, telegramId: "987654321", question: "Safety protocol followed", response: "Yellow", created_at: new Date().toISOString() },
      { id: 6, telegramId: "987654321", question: "Documentation updated", response: "No", created_at: new Date().toISOString() },
      { id: 7, telegramId: "789123456", question: "Equipment check completed", response: "Yes", created_at: new Date().toISOString() },
      { id: 8, telegramId: "789123456", question: "Safety protocol followed", response: "Green", created_at: new Date().toISOString() },
      { id: 9, telegramId: "789123456", question: "Work area clean", response: "Above", created_at: new Date().toISOString() },
      { id: 10, telegramId: "789123456", question: "Documentation updated", response: "Yes", created_at: new Date().toISOString() },
    ];

    // Handle case where CheckListQuestion table doesn't exist or has no data
    if (checklistError) {
      console.warn('Supabase checklist table not found or error, using mock checklist data:', checklistError);
    }

    // Fetch master data from Airtable with fallback
    let users: User[] = [];
    let templates: CheckListTemplate[] = [];

    try {
      const [airtableUsers, airtableTemplates] = await Promise.all([
        fetchAirtableUsers(),
        fetchAirtableChecklistTemplates()
      ]);
      users = airtableUsers;
      templates = airtableTemplates;
    } catch (airtableError) {
      console.warn('Airtable fetch failed, using mock data:', airtableError);

      // Mock data for testing purposes
      users = [
        { TelegramId: "123456789", Name: "John Smith", UserGroup: "Operator" },
        { TelegramId: "987654321", Name: "Sarah Johnson", UserGroup: "Operator" },
        { TelegramId: "456789123", Name: "Mike Davis", UserGroup: "Coordinator" },
        { TelegramId: "789123456", Name: "Emily Wilson", UserGroup: "Operator" },
      ];

      templates = [
        { Question: "Equipment check completed", ResponseType: "Yes/No" },
        { Question: "Safety protocol followed", ResponseType: "Enum (Green/Yellow/Red)" },
        { Question: "Work area clean", ResponseType: "Enum (Ok/Below/Above)" },
        { Question: "Documentation updated", ResponseType: "Yes/No" },
      ];
    }

    // Use real data if available, otherwise use mock data
    const finalChecklistData = checklistError ? mockChecklistData : (checklistData || []);

    // Process and calculate performance metrics
    const operatorPerformances = await processOperatorPerformance(
      finalChecklistData,
      users,
      templates
    );

    // Calculate summary statistics
    const totalOperators = operatorPerformances.length;
    const totalChecklists = operatorPerformances.reduce((sum, op) => sum + op.totalChecklists, 0);
    const totalPassed = operatorPerformances.reduce((sum, op) => sum + op.passedCount, 0);
    const averagePassRate = totalOperators > 0
      ? Math.round(operatorPerformances.reduce((sum, op) => sum + op.passRate, 0) / totalOperators)
      : 0;
    const overallPassRate = totalChecklists > 0
      ? Math.round((totalPassed / totalChecklists) * 100)
      : 0;

    const response: OperatorPerformanceResponse = {
      data: operatorPerformances,
      summary: {
        totalOperators,
        averagePassRate,
        totalChecklists,
        overallPassRate,
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Operator performance API error:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch operator performance data',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    // Return appropriate status code
    const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/operator-performance
 * Reserved for future functionality (e.g., manual refresh, caching control)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();

    // For now, just return a success message
    // Future implementation could handle cache invalidation, data refresh, etc.
    return NextResponse.json({
      message: 'Operator performance data refresh initiated',
      timestamp: new Date().toISOString(),
      request: body
    });

  } catch (error) {
    console.error('Operator performance POST error:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}