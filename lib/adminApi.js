// Superadmin calls to the account endpoints (database-backed; passwords are never read back).

async function call(method, path, body) {
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, message: json?.message || (res.ok ? "OK" : "Permintaan gagal."), data: json?.data ?? null };
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server.", data: null };
  }
}

export const listCommittee = () => call("GET", "/api/admin/committee");
export const addCommittee = (member) => call("POST", "/api/admin/committee", member);
export const removeCommittee = (id) => call("DELETE", `/api/admin/committee/${encodeURIComponent(id)}`);
export const resetCommitteePassword = (id, password) =>
  call("PATCH", `/api/admin/committee/${encodeURIComponent(id)}`, { password });

export const getAccounts = () => call("GET", "/api/admin/accounts");
export const updateAccount = (who, changes) => call("PATCH", `/api/admin/accounts/${who}`, changes);
