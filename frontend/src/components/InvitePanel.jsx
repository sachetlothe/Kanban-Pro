import { useState } from "react";

export const InvitePanel = ({ onInvite }) => {
  const [form, setForm] = useState({ email: "", role: "member" });

  const submit = async (event) => {
    event.preventDefault();
    await onInvite(form);
    setForm({ email: "", role: "member" });
  };

  return (
    <form className="panel compact invite-form" onSubmit={submit}>
      <div className="section-head">
        <h3>Invite teammate</h3>
      </div>
      <input
        type="email"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        placeholder="teammate@email.com"
        required
      />
      <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Send invite</button>
    </form>
  );
};
