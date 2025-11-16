"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      // Check session API
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();
      setSessionInfo(sessionData);

      // Check documents API
      const docsResponse = await fetch("/api/documents");
      const docsData = await docsResponse.json();
      setApiResponse({
        status: docsResponse.status,
        ok: docsResponse.ok,
        data: docsData,
      });

    } catch (error) {
      console.error("Debug error:", error);
      setApiResponse({ error: error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return <div className="p-6">Loading debug info...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables (Safe)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Supabase URL exists: {!!process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p>Supabase Key exists: {!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}</p>
          <p>Admin Username exists: {!!process.env.ADMIN_USERNAME}</p>
        </CardContent>
      </Card>
    </div>
  );
}