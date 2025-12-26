"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Plus, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanySwitcher() {
  const { companies, currentCompany, switchCompany, loading } = useCompany();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Skeleton className="h-9 w-[200px]" />
    );
  }

  if (!currentCompany) {
    return (
      <Button variant="outline" size="sm" className="gap-2">
        <Building2 className="h-4 w-4" />
        No Company
      </Button>
    );
  }

  // Non-admin users only see current company name without switcher
  if (!isAdmin()) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{currentCompany.name}</span>
      </div>
    );
  }

  // Admin users get full switcher functionality
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{currentCompany.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Switch Company</p>
            <p className="text-xs text-muted-foreground">
              Select a company to manage
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => {
              switchCompany(company.id);
              setOpen(false);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-4 w-4 rounded"
                />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <div className="flex flex-col">
                <span className="text-sm">{company.name}</span>
                {company.user_count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {company.user_count} {company.user_count === 1 ? 'user' : 'users'}
                  </span>
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            window.location.href = "/dashboard/companies";
            setOpen(false);
          }}
          className="cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Companies
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
