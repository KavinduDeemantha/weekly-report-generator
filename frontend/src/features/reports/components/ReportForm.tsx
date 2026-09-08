import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { ErrorState, PageLoading } from '../../../components/common/PageState';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { projectsApi } from '../../projects/api';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '../../../api/errors';
import { defaultReportValues } from '../adapters';
import {
  reportFormSchema,
  taskPriorities,
  taskStatuses,
  timeEntryTypes,
} from '../schemas';
import type { ReportFormValues } from '../types';

type ReportFormProps = {
  initialValues?: ReportFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (values: ReportFormValues) => void;
};

export function ReportForm({
  initialValues = defaultReportValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
}: ReportFormProps) {
  const projectsQuery = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: projectsApi.listActive,
  });

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: initialValues,
  });

  const tasks = useFieldArray({ control: form.control, name: 'tasks' });
  const nextWeekTasks = useFieldArray({
    control: form.control,
    name: 'nextWeekTasks',
  });
  const blockers = useFieldArray({ control: form.control, name: 'blockers' });
  const achievements = useFieldArray({
    control: form.control,
    name: 'achievements',
  });
  const timeEntries = useFieldArray({
    control: form.control,
    name: 'timeEntries',
  });

  if (projectsQuery.isLoading) {
    return <PageLoading label="Loading projects" />;
  }

  if (projectsQuery.isError) {
    return <ErrorState message={getErrorMessage(projectsQuery.error)} />;
  }

  const projects = projectsQuery.data?.data ?? [];

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      {error ? <ErrorState message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Report details</CardTitle>
          <CardDescription>Week, project, and optional notes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            error={form.formState.errors.weekStart?.message}
            label="Week start"
          >
            <Input type="date" {...form.register('weekStart')} />
          </FormField>
          <FormField
            error={form.formState.errors.weekEnd?.message}
            label="Week end"
          >
            <Input type="date" {...form.register('weekEnd')} />
          </FormField>
          <FormField
            className="sm:col-span-2"
            error={form.formState.errors.projectId?.message}
            label="Project"
          >
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={projects.length === 0}
              {...form.register('projectId')}
            >
              <option value="">Choose project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            className="sm:col-span-2"
            error={form.formState.errors.notes?.message}
            label="Notes"
          >
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register('notes')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Tasks completed</CardTitle>
              <CardDescription>Progress and effort for this week.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                tasks.append({
                  name: '',
                  priority: 'MEDIUM',
                  plannedPercentage: 100,
                  actualPercentage: 0,
                  status: 'IN_PROGRESS',
                  plannedHours: 0,
                  actualHours: 0,
                  deliverable: '',
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add task
            </Button>
          </div>
          {form.formState.errors.tasks?.root?.message ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.tasks.root.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.fields.map((field, index) => (
            <div
              className="grid gap-4 rounded-md border border-border bg-slate-50 p-4 lg:grid-cols-4"
              key={field.id}
            >
              <FormField
                className="lg:col-span-2"
                error={form.formState.errors.tasks?.[index]?.name?.message}
                label="Task name"
              >
                <Input {...form.register(`tasks.${index}.name`)} />
              </FormField>
              <FormField label="Priority">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...form.register(`tasks.${index}.priority`)}
                >
                  {taskPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...form.register(`tasks.${index}.status`)}
                >
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                error={
                  form.formState.errors.tasks?.[index]?.plannedPercentage
                    ?.message
                }
                label="Planned %"
              >
                <Input
                  type="number"
                  {...form.register(`tasks.${index}.plannedPercentage`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <FormField
                error={
                  form.formState.errors.tasks?.[index]?.actualPercentage
                    ?.message
                }
                label="Actual %"
              >
                <Input
                  type="number"
                  {...form.register(`tasks.${index}.actualPercentage`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <FormField
                error={form.formState.errors.tasks?.[index]?.plannedHours?.message}
                label="Planned hours"
              >
                <Input
                  step="0.25"
                  type="number"
                  {...form.register(`tasks.${index}.plannedHours`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <FormField
                error={form.formState.errors.tasks?.[index]?.actualHours?.message}
                label="Actual hours"
              >
                <Input
                  step="0.25"
                  type="number"
                  {...form.register(`tasks.${index}.actualHours`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <FormField
                className="lg:col-span-3"
                error={form.formState.errors.tasks?.[index]?.deliverable?.message}
                label="Deliverable"
              >
                <Input {...form.register(`tasks.${index}.deliverable`)} />
              </FormField>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => tasks.remove(index)}
                  disabled={tasks.fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <RepeatableTextSection
        addLabel="Add plan"
        description="Planned tasks for the next reporting week."
        getError={(index) =>
          form.formState.errors.nextWeekTasks?.[index]?.description?.message
        }
        fields={nextWeekTasks.fields}
        label="Description"
        name="nextWeekTasks"
        register={form.register}
        remove={nextWeekTasks.remove}
        title="Next week tasks"
        append={() => nextWeekTasks.append({ description: '' })}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Blockers</CardTitle>
              <CardDescription>Mark at most one key issue.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                blockers.append({
                  description: '',
                  isKeyIssue: false,
                  isResolved: false,
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add blocker
            </Button>
          </div>
          {typeof form.formState.errors.blockers?.message === 'string' ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.blockers.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {blockers.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blockers added.</p>
          ) : null}
          {blockers.fields.map((field, index) => (
            <div className="rounded-md border border-border bg-slate-50 p-4" key={field.id}>
              <FormField
                error={form.formState.errors.blockers?.[index]?.description?.message}
                label="Description"
              >
                <Input {...form.register(`blockers.${index}.description`)} />
              </FormField>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register(`blockers.${index}.isKeyIssue`)} />
                  Key issue
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register(`blockers.${index}.isResolved`)} />
                  Resolved
                </label>
                <Button type="button" variant="outline" onClick={() => blockers.remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Mark at most one key achievement.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                achievements.append({
                  description: '',
                  isKeyAchievement: false,
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add achievement
            </Button>
          </div>
          {typeof form.formState.errors.achievements?.message === 'string' ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.achievements.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No achievements added.</p>
          ) : null}
          {achievements.fields.map((field, index) => (
            <div className="rounded-md border border-border bg-slate-50 p-4" key={field.id}>
              <FormField
                error={
                  form.formState.errors.achievements?.[index]?.description
                    ?.message
                }
                label="Description"
              >
                <Input {...form.register(`achievements.${index}.description`)} />
              </FormField>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...form.register(`achievements.${index}.isKeyAchievement`)}
                  />
                  Key achievement
                </label>
                <Button type="button" variant="outline" onClick={() => achievements.remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Time entries</CardTitle>
              <CardDescription>Optional effort breakdown.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => timeEntries.append({ type: 'DEVELOPMENT', hours: 0 })}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add time
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeEntries.fields.map((field, index) => (
            <div className="grid gap-4 rounded-md border border-border bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]" key={field.id}>
              <FormField label="Type">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...form.register(`timeEntries.${index}.type`)}
                >
                  {timeEntryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                error={form.formState.errors.timeEntries?.[index]?.hours?.message}
                label="Hours"
              >
                <Input
                  step="0.25"
                  type="number"
                  {...form.register(`timeEntries.${index}.hours`, {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => timeEntries.remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-slate-50 py-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  children,
  className,
  error,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  error?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

type RepeatableTextSectionProps = {
  addLabel: string;
  append: () => void;
  description: string;
  fields: { id: string }[];
  getError: (index: number) => string | undefined;
  label: string;
  name: 'nextWeekTasks';
  register: ReturnType<typeof useForm<ReportFormValues>>['register'];
  remove: (index: number) => void;
  title: string;
};

function RepeatableTextSection({
  addLabel,
  append,
  description,
  fields,
  getError,
  label,
  name,
  register,
  remove,
  title,
}: RepeatableTextSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={append}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {addLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items added.</p>
        ) : null}
        {fields.map((field, index) => (
          <div
            className="grid gap-3 rounded-md border border-border bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"
            key={field.id}
          >
            <FormField error={getError(index)} label={label}>
              <Input {...register(`${name}.${index}.description`)} />
            </FormField>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
