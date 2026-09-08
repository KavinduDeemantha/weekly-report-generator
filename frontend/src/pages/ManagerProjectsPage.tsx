import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../api/errors';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { projectsApi } from '../features/projects/api';
import { projectKeys } from '../features/projects/query-keys';
import {
  projectFormSchema,
  type ProjectFormValues,
} from '../features/projects/schemas';
import type { Project } from '../types/projects';

export function ManagerProjectsPage() {
  const [page, setPage] = useState(1);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const filters = { page, limit: 20 };
  const projectsQuery = useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectsApi.list(filters),
  });

  const createProject = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: async () => {
      await invalidateProjectQueries(queryClient);
      setIsCreateOpen(false);
    },
  });
  const updateProject = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      projectsApi.update(id, values),
    onSuccess: async () => {
      await invalidateProjectQueries(queryClient);
      setEditingProject(null);
    },
  });
  const deactivateProject = useMutation({
    mutationFn: projectsApi.deactivate,
    onSuccess: () => invalidateProjectQueries(queryClient),
  });

  async function handleDeactivate(project: Project) {
    const confirmed = window.confirm(
      `Deactivate ${project.name}? Existing reports will keep their project reference.`,
    );

    if (confirmed) {
      await deactivateProject.mutateAsync(project.id);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage report categories and active project availability.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create project
        </Button>
      </div>

      {projectsQuery.isLoading ? <PageLoading label="Loading projects" /> : null}
      {projectsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(projectsQuery.error)}
          onRetry={() => void projectsQuery.refetch()}
        />
      ) : null}
      {projectsQuery.data && projectsQuery.data.data.length === 0 ? (
        <EmptyState
          title="No projects"
          description="Create the first project for team reports."
        />
      ) : null}

      {projectsQuery.data && projectsQuery.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectsQuery.data.data.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.description ?? 'No description'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        project.isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-slate-300 bg-slate-100 text-slate-700'
                      }
                    >
                      {project.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingProject(project)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!project.isActive || deactivateProject.isPending}
                        onClick={() => void handleDeactivate(project)}
                      >
                        <Power className="h-4 w-4" aria-hidden="true" />
                        Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {projectsQuery.data.meta.page} of{' '}
              {projectsQuery.data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= projectsQuery.data.meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ProjectDialog
        error={formError}
        isOpen={isCreateOpen}
        isSubmitting={createProject.isPending}
        title="Create project"
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (values) => {
          setFormError(null);
          try {
            await createProject.mutateAsync(values);
          } catch (error) {
            setFormError(getErrorMessage(error));
          }
        }}
      />

      <ProjectDialog
        error={formError}
        initialProject={editingProject}
        isOpen={Boolean(editingProject)}
        isSubmitting={updateProject.isPending}
        title="Edit project"
        onClose={() => setEditingProject(null)}
        onSubmit={async (values) => {
          if (!editingProject) {
            return;
          }

          setFormError(null);
          try {
            await updateProject.mutateAsync({
              id: editingProject.id,
              values,
            });
          } catch (error) {
            setFormError(getErrorMessage(error));
          }
        }}
      />
    </section>
  );
}

function ProjectDialog({
  error,
  initialProject,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  title,
}: {
  error: string | null;
  initialProject?: Project | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  title: string;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    values: {
      name: initialProject?.name ?? '',
      description: initialProject?.description ?? '',
      isActive: initialProject?.isActive ?? true,
    },
  });

  return (
    <Dialog isOpen={isOpen} title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? <ErrorState message={error} /> : null}
        <div>
          <Label htmlFor="project-name">Name</Label>
          <Input className="mt-2" id="project-name" {...form.register('name')} />
          {form.formState.errors.name ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="project-description">Description</Label>
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="project-description"
            {...form.register('description')}
          />
          {form.formState.errors.description ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>
        {initialProject ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isActive')} />
            Active
          </label>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

async function invalidateProjectQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: ['projects', 'active'] }),
  ]);
}
