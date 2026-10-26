// Pure array operations shared by the browser (optimistic update) and the server (source of truth).
// They let several devices change the same list (queue, booths, votes) without overwriting each other.
//
//   { type: "append", item, idField? }            add; skipped if an element with the same id/value exists
//   { type: "prepend", item, idField? }           same as append, but at the front
//   { type: "remove", id, idField? }               remove the element with that id/value
//   { type: "patch",  id, fields, idField? }       merge fields into the element with that id

function sameId(element, id, idField) {
  const value = element !== null && typeof element === "object" ? element[idField] : element;
  return String(value) === String(id);
}

export function applyOp(current, op) {
  const list = Array.isArray(current) ? current : [];
  const idField = op.idField || "id";

  switch (op.type) {
    case "append": {
      const id = op.item !== null && typeof op.item === "object" ? op.item[idField] : op.item;
      if (id !== undefined && list.some((el) => sameId(el, id, idField))) return list;
      return [...list, op.item];
    }
    case "prepend": {
      const id = op.item !== null && typeof op.item === "object" ? op.item[idField] : op.item;
      if (id !== undefined && list.some((el) => sameId(el, id, idField))) return list;
      return [op.item, ...list];
    }
    case "remove":
      return list.filter((el) => !sameId(el, op.id, idField));
    case "patch":
      return list.map((el) => (sameId(el, op.id, idField) ? { ...el, ...op.fields } : el));
    default:
      return list;
  }
}

export const STATE_OP_TYPES = ["append", "prepend", "remove", "patch"];

// Keys that are shared between devices. Everything else stays in the browser only.
const NEVER_SYNCED = [
  /^osis_auth_session$/,
  /^osis_booth_session$/,
  /^osis_auth_creds$/,
  /^osis_committee_list/, // accounts live in the database now
  /^osis_custom_dpt/, // every device loads the voter list straight from Sinar
  /^osis_custom_teachers$/,
];

export function isSyncedKey(key) {
  return /^osis_[a-z_]+(@\d+)?$/.test(key) && !NEVER_SYNCED.some((re) => re.test(key));
}

export function baseKey(key) {
  return key.replace(/@\d+$/, "");
}
