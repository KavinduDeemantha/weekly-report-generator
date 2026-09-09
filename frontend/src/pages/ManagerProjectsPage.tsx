import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../api/errors';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
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
import { usersApi } from '../features/users/api';
import { userKeys } from '../features/users/query-keys';

export function ManagerProjectsPage() {
  const [page, setPage] = useState(1);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deactivatingProject, setDeactivatingProject] =
    useState<Project | null>(null);
  const [memberProject, setMemberProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const filters = { page, limit: 20 };
  const projectsQuery = useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectsApi.list(filters),
  });
  const usersQuery = useQuery({
    queryKey: userKeys.list({ page: 1, limit: 100 }),
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
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
    onSuccess: async () => {
      await invalidateProjectQueries(queryClient);
      setDeactivatingProject(null);
    },
  });

  async function handleDeactivate() {
    if (!deactivatingProject) {
      return;
    }

    await deactivateProject.mutateAsync(deactivatingProject.id);
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
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectsQuery.data.data.map((project) => (
                <tr className="transition-colors hover:bg-muted/40" key={project.id}>
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      {project.assignedMemberCount ?? 0} assigned members
                    </p>
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
                        disabled={!project.isActive}
                        onClick={() => setMemberProject(project)}
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Members
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!project.isActive || deactivateProject.isPending}
                        onClick={() => setDeactivatingProject(project)}
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
          </div>
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

      <ConfirmDialog
        confirmLabel="Deactivate"
        description={
          deactivatingProject
            ? `${deactivatingProject.name} will no longer be available for new reports. Existing reports keep their project reference.`
            : ''
        }
        isConfirming={deactivateProject.isPending}
        isOpen={Boolean(deactivatingProject)}
        title="Deactivate project?"
        variant="destructive"
        onCancel={() => setDeactivatingProject(null)}
        onConfirm={() => void handleDeactivate()}
      />

      <ProjectMembersDialog
        isOpen={Boolean(memberProject)}
        project={memberProject}
        teamMembers={(usersQuery.data?.data ?? []).filter(
          (user) => user.role === 'TEAM_MEMBER',
        )}
        onClose={() => {
          setMemberProject(null);
          setFormError(null);
        }}
        onSaved={async () => {
          await invalidateProjectQueries(queryClient);
          setMemberProject(null);
        }}
      />
    </section>
  );
}

function ProjectMembersDialog({
  isOpen,
  onClose,
  onSaved,
  project,
  teamMembers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  project: Project | null;
  teamMembers: Array<{ id: string; name: string; email: string }>;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const membersQuery = useQuery({
    queryKey: projectKeys.members(project?.id ?? ''),
    queryFn: () => projectsApi.listMembers(project?.id ?? ''),
    enabled: Boolean(project?.id) && isOpen,
  });
  const updateMembers = useMutation({
    mutationFn: () => projectsApi.updateMembers(project?.id ?? '', selectedIds),
    onSuccess: async () => {
      if (project) {
        await queryClient.invalidateQueries({
          queryKey: projectKeys.members(project.id),
        });
      }
      await onSaved();
    },
  });

  useEffect(() => {
    if (membersQuery.data) {
      setSelectedIds(membersQuery.data.map((member) => member.id));
    }
  }, [membersQuery.data]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  function toggleMember(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  return (
    <Dialog
      description="Choose which team members can create reports for this project."
      isOpen={isOpen}
      title={project ? `Project members: ${project.name}` : 'Project members'}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error ? <ErrorState message={error} /> : null}
        {membersQuery.isLoading ? <PageLoading label="Loading project members" /> : null}
        {membersQuery.isError ? (
          <ErrorState message={getErrorMessage(membersQuery.error)} />
        ) : null}
        {!membersQuery.isLoading && !membersQuery.isError ? (
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
            {teamMembers.map((member) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                key={member.id}
              >
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={selectedIds.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                />
                <span>
                  <span className="block font-medium">{member.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={updateMembers.isPending || membersQuery.isLoading}
            onClick={() => {
              setError(null);
              void updateMembers.mutateAsync().catch((saveError: unknown) => {
                setError(getErrorMessage(saveError));
              });
            }}
          >
            Save members
          </Button>
        </div>
      </div>
    </Dialog>
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
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="project-description">Description</Label>
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary"
            id="project-description"
            {...form.register('description')}
          />
          {form.formState.errors.description ? (
            <p className="mt-1 text-sm text-destructive">
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
