frappe.pages["dealerp-dashboard"].on_page_load = function (wrapper) {
    new DealerPDashboard(wrapper);
};

class DealerPDashboard {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: __("Tableau de bord DealERP"),
            single_column: true
        });

        this.render();
        this.load_data();
    }

    render() {
        $(this.page.body).html(`
            <div class="dealerp-dashboard">

                <div class="dealerp-dashboard-header">
                    <div>
                        <h2>Tableau de bord</h2>
                        <p class="text-muted">
                            Vue globale de l'activité DealERP
                        </p>
                    </div>

                    <button class="btn btn-default dealerp-refresh">
                        <i class="fa fa-refresh"></i>
                        Actualiser
                    </button>
                </div>

                <div class="dealerp-kpis">

                    <div class="dealerp-kpi">
                        <div class="dealerp-kpi-label">Chiffre d'affaires</div>
                        <div class="dealerp-kpi-value" data-kpi="revenue">
                            —
                        </div>
                    </div>

                    <div class="dealerp-kpi">
                        <div class="dealerp-kpi-label">Facturé</div>
                        <div class="dealerp-kpi-value" data-kpi="invoiced">
                            —
                        </div>
                    </div>

                    <div class="dealerp-kpi">
                        <div class="dealerp-kpi-label">Encaissé</div>
                        <div class="dealerp-kpi-value" data-kpi="received">
                            —
                        </div>
                    </div>

                    <div class="dealerp-kpi">
                        <div class="dealerp-kpi-label">Impayés</div>
                        <div class="dealerp-kpi-value" data-kpi="outstanding">
                            —
                        </div>
                    </div>

                </div>

                <div class="dealerp-section">
                    <div class="dealerp-section-header">
                        <h4>Activité opérationnelle</h4>
                    </div>

                    <div class="dealerp-activity-grid">

                        <div class="dealerp-activity-card">
                            <span>Dossiers</span>
                            <strong data-kpi="dossiers">—</strong>
                        </div>

                        <div class="dealerp-activity-card">
                            <span>Expéditions</span>
                            <strong data-kpi="expeditions">—</strong>
                        </div>

                        <div class="dealerp-activity-card">
                            <span>Prestations</span>
                            <strong data-kpi="prestations">—</strong>
                        </div>

                        <div class="dealerp-activity-card">
                            <span>Tâches</span>
                            <strong data-kpi="tasks">—</strong>
                        </div>

                    </div>
                </div>

                <div class="dealerp-section">
                    <div class="dealerp-section-header">
                        <h4>Dossiers récents</h4>
                    </div>

                    <div class="dealerp-recent-dossiers">
                        <div class="text-muted">
                            Chargement...
                        </div>
                    </div>
                </div>

            </div>
        `);

        this.add_styles();

        this.page.body.find(".dealerp-refresh").on("click", () => {
            this.load_data();
        });
    }

    load_data() {
        frappe.call({
            method: "dealerp.api.dashboard.get_dashboard_data",
            callback: (r) => {
                if (!r.message) {
                    return;
                }

                this.update(r.message);
            }
        });
    }

    update(data) {
        const kpis = data.kpis || {};

        Object.keys(kpis).forEach(key => {
            this.page.body
                .find(`[data-kpi="${key}"]`)
                .text(kpis[key]);
        });

        const dossiers = data.recent_dossiers || [];

        if (!dossiers.length) {
            this.page.body.find(".dealerp-recent-dossiers").html(
                `<div class="text-muted">Aucun dossier récent.</div>`
            );
            return;
        }

        const rows = dossiers.map(d => `
            <tr>
                <td>
                    <a href="/app/dossier/${encodeURIComponent(d.name)}">
                        ${frappe.utils.escape_html(d.name)}
                    </a>
                </td>
                <td>${frappe.utils.escape_html(d.customer || "")}</td>
                <td>${frappe.utils.escape_html(d.priority || "")}</td>
                <td>${frappe.datetime.str_to_user(d.modified)}</td>
            </tr>
        `).join("");

        this.page.body.find(".dealerp-recent-dossiers").html(`
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Dossier</th>
                            <th>Client</th>
                            <th>Priorité</th>
                            <th>Modification</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `);
    }

    add_styles() {
        if ($("#dealerp-dashboard-styles").length) {
            return;
        }

        $("head").append(`
            <style id="dealerp-dashboard-styles">

                .dealerp-dashboard {
                    padding: 24px;
                }

                .dealerp-dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .dealerp-dashboard-header h2 {
                    margin-bottom: 4px;
                }

                .dealerp-kpis {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .dealerp-kpi {
                    background: var(--card-bg, #fff);
                    border: 1px solid var(--border-color, #d1d8dd);
                    border-radius: 10px;
                    padding: 20px;
                }

                .dealerp-kpi-label {
                    color: var(--text-muted);
                    font-size: 13px;
                    margin-bottom: 10px;
                }

                .dealerp-kpi-value {
                    font-size: 25px;
                    font-weight: 600;
                }

                .dealerp-section {
                    background: var(--card-bg, #fff);
                    border: 1px solid var(--border-color, #d1d8dd);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .dealerp-section-header {
                    margin-bottom: 18px;
                }

                .dealerp-section-header h4 {
                    margin: 0;
                }

                .dealerp-activity-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 16px;
                }

                .dealerp-activity-card {
                    border: 1px solid var(--border-color, #d1d8dd);
                    border-radius: 8px;
                    padding: 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dealerp-activity-card strong {
                    font-size: 22px;
                }

                @media (max-width: 900px) {
                    .dealerp-kpis,
                    .dealerp-activity-grid {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 600px) {
                    .dealerp-kpis,
                    .dealerp-activity-grid {
                        grid-template-columns: 1fr;
                    }
                }

            </style>
        `);
    }
}
