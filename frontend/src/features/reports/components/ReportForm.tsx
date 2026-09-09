import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { Dialog } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { getErrorMessage } from '../../../api/errors';
import { aiApi } from '../../ai/api';
import {
  buildReportAssistantContext,
  getReportValuesAfterAssistantSuggestion,
  reportAssistantActionLabels,
} from '../../ai/report-assistant';
import type {
  ReportAssistantAction,
  ReportAssistantResponse,
} from '../../ai/types';
import { projectsApi } from '../../projects/api';
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
  const [assistantAction, setAssistantAction] =
    useState<ReportAssistantAction | null>(null);
  const [assistantResponse, setAssistantResponse] =
    useState<ReportAssistantResponse | null>(null);

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

  const watchedNotes = form.watch('notes');
  const watchedTasks = form.watch('tasks');
  const watchedBlockers = form.watch('blockers');
  const watchedAchievements = form.watch('achievements');

  const assistantMutation = useMutation({
    mutationFn: aiApi.getReportSuggestion,
    onSuccess: (response) => {
      setAssistantResponse(response);
    },
  });

  const isAssistantBusy = assistantMutation.isPending;

  function requestAssistantSuggestion(action: ReportAssistantAction) {
    const values = form.getValues();

    setAssistantAction(action);
    setAssistantResponse(null);
    assistantMutation.reset();
    assistantMutation.mutate({
      action,
      context: buildReportAssistantContext(values, action),
    });
  }

  function closeAssistantDialog() {
    if (isAssistantBusy) {
      return;
    }

    setAssistantAction(null);
    setAssistantResponse(null);
    assistantMutation.reset();
  }

  function applyAssistantSuggestion(response: ReportAssistantResponse) {
    const nextValues = getReportValuesAfterAssistantSuggestion(
      form.getValues(),
      response,
    );

    switch (response.action) {
      case 'IMPROVE_WRITING':
      case 'SUMMARIZE_WEEK':
        form.setValue('notes', nextValues.notes, {
          shouldDirty: true,
          shouldValidate: true,
        });
        break;
      case 'IMPROVE_BLOCKERS':
        blockers.replace(nextValues.blockers);
        form.setValue('blockers', nextValues.blockers, {
          shouldDirty: true,
          shouldValidate: true,
        });
        break;
      case 'IMPROVE_ACHIEVEMENTS':
        achievements.replace(nextValues.achievements);
        form.setValue('achievements', nextValues.achievements, {
          shouldDirty: true,
          shouldValidate: true,
        });
        break;
      case 'SUGGEST_NEXT_WEEK':
        nextWeekTasks.replace(nextValues.nextWeekTasks);
        form.setValue('nextWeekTasks', nextValues.nextWeekTasks, {
          shouldDirty: true,
          shouldValidate: true,
        });
        break;
    }

    closeAssistantDialog();
  }

  const hasReportText =
    Boolean(watchedNotes?.trim()) ||
    watchedTasks.some((task) => task.name.trim() || task.deliverable?.trim());
  const hasBlockerText = watchedBlockers.some((blocker) =>
    blocker.description.trim(),
  );
  const hasAchievementText = watchedAchievements.some((achievement) =>
    achievement.description.trim(),
  );

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Report details</CardTitle>
              <CardDescription>Week, project, and optional notes.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <AiActionButton
                action="IMPROVE_WRITING"
                disabled={!hasReportText}
                isBusy={isAssistantBusy}
                onClick={requestAssistantSuggestion}
              />
              <AiActionButton
                action="SUMMARIZE_WEEK"
                disabled={!hasReportText}
                isBusy={isAssistantBusy}
                onClick={requestAssistantSuggestion}
              />
            </div>
          </div>
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
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
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
              className="min-h-28 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary"
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
              <p className="text-sm text-destructive">
              {form.formState.errors.tasks.root.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.fields.map((field, index) => (
            <div
              className="grid gap-4 rounded-lg border border-border bg-muted/40 p-4 lg:grid-cols-4"
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
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
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
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
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
        extraAction={
          <AiActionButton
            action="SUGGEST_NEXT_WEEK"
            disabled={!hasReportText}
            isBusy={isAssistantBusy}
            onClick={requestAssistantSuggestion}
          />
        }
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
            <div className="flex flex-wrap gap-2">
              <AiActionButton
                action="IMPROVE_BLOCKERS"
                disabled={!hasBlockerText}
                isBusy={isAssistantBusy}
                onClick={requestAssistantSuggestion}
              />
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
          </div>
          {typeof form.formState.errors.blockers?.message === 'string' ? (
              <p className="text-sm text-destructive">
              {form.formState.errors.blockers.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {blockers.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blockers added.</p>
          ) : null}
          {blockers.fields.map((field, index) => (
            <div className="rounded-lg border border-border bg-muted/40 p-4" key={field.id}>
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
            <div className="flex flex-wrap gap-2">
              <AiActionButton
                action="IMPROVE_ACHIEVEMENTS"
                disabled={!hasAchievementText}
                isBusy={isAssistantBusy}
                onClick={requestAssistantSuggestion}
              />
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
          </div>
          {typeof form.formState.errors.achievements?.message === 'string' ? (
              <p className="text-sm text-destructive">
              {form.formState.errors.achievements.message}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No achievements added.</p>
          ) : null}
          {achievements.fields.map((field, index) => (
            <div className="rounded-lg border border-border bg-muted/40 p-4" key={field.id}>
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
            <div className="grid gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-[1fr_1fr_auto]" key={field.id}>
              <FormField label="Type">
                <select
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
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

      <AiSuggestionDialog
        action={assistantAction}
        error={
          assistantMutation.isError
            ? getErrorMessage(assistantMutation.error)
            : null
        }
        isLoading={isAssistantBusy}
        onApply={applyAssistantSuggestion}
        onClose={closeAssistantDialog}
        onRetry={() => {
          if (assistantAction) {
            requestAssistantSuggestion(assistantAction);
          }
        }}
        response={assistantResponse}
      />

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-4 backdrop-blur">
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

function AiActionButton({
  action,
  disabled,
  isBusy,
  onClick,
}: {
  action: ReportAssistantAction;
  disabled: boolean;
  isBusy: boolean;
  onClick: (action: ReportAssistantAction) => void;
}) {
  return (
    <Button
      className="border-indigo-200 bg-indigo-50/70 text-primary hover:border-indigo-300 hover:bg-indigo-100"
      type="button"
      variant="outline"
      disabled={disabled || isBusy}
      onClick={() => onClick(action)}
    >
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      {reportAssistantActionLabels[action]}
    </Button>
  );
}

function AiSuggestionDialog({
  action,
  error,
  isLoading,
  onApply,
  onClose,
  onRetry,
  response,
}: {
  action: ReportAssistantAction | null;
  error: string | null;
  isLoading: boolean;
  onApply: (response: ReportAssistantResponse) => void;
  onClose: () => void;
  onRetry: () => void;
  response: ReportAssistantResponse | null;
}) {
  const title = action
    ? `AI suggestion: ${reportAssistantActionLabels[action]}`
    : 'AI suggestion';

  return (
    <Dialog
      description="AI suggestions may be inaccurate. Review before applying."
      isOpen={Boolean(action)}
      onClose={onClose}
      title={title}
    >
      <div className="space-y-4" aria-live="polite">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Generating suggestion...
          </div>
        ) : null}

        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : null}

        {response ? (
          <>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI suggestion
              </p>
              {response.suggestions?.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground">
                  {response.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                  {response.suggestion}
                </p>
              )}
              {response.suggestions?.length ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {response.suggestion}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => onApply(response)}>
                Apply suggestion
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
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
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

type RepeatableTextSectionProps = {
  addLabel: string;
  append: () => void;
  description: string;
  extraAction?: React.ReactNode;
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
  extraAction,
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
          <div className="flex flex-wrap gap-2">
            {extraAction}
            <Button type="button" variant="outline" onClick={append}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {addLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items added.</p>
        ) : null}
        {fields.map((field, index) => (
          <div
            className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-[1fr_auto]"
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
