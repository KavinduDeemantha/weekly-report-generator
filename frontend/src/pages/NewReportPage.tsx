import { FilePlus2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function NewReportPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">New Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft creation will be added in the report-form milestone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-primary" aria-hidden="true" />
            Report draft form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border bg-slate-50 p-6 text-sm text-muted-foreground">
            This authenticated route is ready for the structured weekly report
            form without adding frontend report editing yet.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
