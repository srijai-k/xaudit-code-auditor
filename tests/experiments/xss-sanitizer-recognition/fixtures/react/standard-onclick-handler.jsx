// Case 29 — standard onClick handler, out of scope for this rule by design.
function DeleteButton({ onDelete, itemId }) {
    return <button onClick={() => onDelete(itemId)}>Delete</button>;
}
