// A reporting module using Sequelize. The scheduled export job takes a
// user-configurable filter column name, and someone building an "advanced
// filter" feature reached for string building instead of the query
// builder's own escaping.
async function exportUsersByStatus(statusFilter) {
    return sequelize.query("SELECT * FROM users WHERE status = '" + statusFilter + "'");
}

async function exportUsersByStatusSafe(statusFilter) {
    return sequelize.query("SELECT * FROM users WHERE status = :status", {
        replacements: { status: statusFilter },
    });
}

module.exports = { exportUsersByStatus, exportUsersByStatusSafe };
