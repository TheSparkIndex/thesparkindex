"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert, Save } from "lucide-react";
import { deleteUser, saveUser } from "@/lib/actions/admin";
import { Checkbox, ConfirmButton, ErrorBox, Select, StatusBadge } from "./ui";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "viewer" | "author" | "editor" | "admin" | "superadmin";
  isActive: boolean;
  createdAt: Date;
};

const ROLES: Array<{ value: UserRow["role"]; label: string }> = [
  { value: "viewer", label: "Viewer" },
  { value: "author", label: "Autor" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
];

const ROLE_STYLE: Record<UserRow["role"], string> = {
  viewer: "bg-key-muted-soft text-key-muted",
  author: "bg-key-lime-soft text-key-ink",
  editor: "bg-key-orange-soft text-key-orange",
  admin: "bg-key-primary-soft text-key-primary",
  superadmin: "bg-key-ink text-key-white",
};

function UserEditor({ user, onDone }: { user?: UserRow; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRow["role"]>(user?.role ?? "viewer");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  return (
    <form
      action={async (formData) => {
        startTransition(async () => {
          const res = await saveUser(formData);
          if (res?.error) setError(res.error);
          else {
            onDone();
            router.refresh();
          }
        });
      }}
      className="rounded-2xl border border-key-border bg-key-white p-5 shadow-sm"
    >
      {user ? <input type="hidden" name="id" value={user.id} /> : null}
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />

      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">
        {user ? "Editar usuario" : "Nuevo usuario"}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={user?.name}
          placeholder="Nombre"
          className="h-10 rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
        />
        <input
          name="email"
          type="email"
          required
          defaultValue={user?.email}
          placeholder="correo@key.edu.sv"
          className="h-10 rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="password"
          type="password"
          required={!user}
          placeholder={user ? "Nueva contraseña (opcional)" : "Contraseña (mín. 8 caracteres)"}
          className="h-10 rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
        />
        <Select
          label="Rol"
          name="role"
          value={role}
          onChangeValue={(v) => setRole(v as UserRow["role"])}
          options={ROLES}
          className="h-10"
        />
      </div>

      <Checkbox
        className="mt-3"
        name="isActive"
        label="Usuario activo"
        checked={isActive}
        onChange={setIsActive}
      />

      {error && <div className="mt-3"><ErrorBox message={error} /></div>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-key-muted">Los usuarios inactivos no pueden entrar.</span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-key-primary px-4 text-sm font-bold text-white hover:bg-key-primary-dark disabled:opacity-60"
        >
          <Save className="size-3.5" /> {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export function UsersManager({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingUser = users.find((u) => u.id === editingId) ?? null;

  return (
    <div>
      <div className="mb-5 flex items-start gap-2 rounded-xl bg-key-orange/10 px-4 py-3 text-sm font-semibold text-key-orange">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        Solo el rol superadmin puede crear o modificar usuarios.
      </div>

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-key-primary px-5 py-2.5 font-bold text-white hover:bg-key-primary-dark"
        >
          <Plus className="size-4" /> Nuevo usuario
        </button>
      )}

      {adding && (
        <div className="mb-4">
          <UserEditor onDone={() => setAdding(false)} />
        </div>
      )}

      {editingUser && (
        <div className="mb-4">
          <UserEditor
            user={editingUser}
            onDone={() => setEditingId(null)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-key-border bg-key-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-key-border text-xs font-black uppercase tracking-wide text-key-muted">
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-key-border">
            {users.map((u) => (
              <tr key={u.id} className="text-sm hover:bg-key-surface-alt">
                <td className="px-5 py-3">
                  <p className="font-bold text-key-ink">
                    {u.name}
                    {u.id === currentUserId && <span className="ml-2 rounded-full bg-key-lime-soft px-2 py-0.5 text-[10px] font-black uppercase text-key-ink">tú</span>}
                  </p>
                  <p className="text-xs text-key-muted">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${ROLE_STYLE[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge active={u.isActive}>{u.isActive ? "Activo" : "Inactivo"}</StatusBadge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(u.id);
                        setAdding(false);
                      }}
                      className="rounded-md bg-key-surface-alt px-2.5 py-1 text-xs font-bold text-key-ink hover:bg-key-primary-soft"
                    >
                      Editar
                    </button>
                    <ConfirmButton
                      onConfirm={async () => {
                        const res = await deleteUser(u.id);
                        if (res?.error) {
                          window.alert(res.error);
                          return;
                        }
                        router.refresh();
                      }}
                    >
                      Eliminar
                    </ConfirmButton>
                    <span className="text-xs text-key-muted">{u.createdAt.toLocaleDateString("es-SV")}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
