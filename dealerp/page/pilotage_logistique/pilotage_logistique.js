frappe.pages["pilotage-logistique"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "Pilotage logistique",
        single_column: true
    });

    page.main.html(`
        <div class="dealerp-dashboard">

            <div class="dealerp-dashboard-header">
                <div>
                    <h2>Pilotage logistique</h2>
                    <p>Vue globale de l'activité</p>
                </div>

                <button class="btn btn-default" id="dealerp-refresh">
                    <i class="fa fa-refresh"></i>
                    Actualiser
                </button>
            </div>

            <div class="dealerp-kpis">

                <div class="dealerp-kpi">
                    <div class="dealerp-kpi-icon">
                        <i class="fa fa-folder-open"></i>
                    </div>
                    <div>
                        <div class="dealerp-kpi-label">Dossiers</div>
                        <div class="dealerp-kpi-value" id="kpi-dossiers">—</div>
                    </div>
                </div>

                <div class="dealerp-kpi">
                    <div class="dealerp-kpi-icon">
                        <i class="fa fa-truck"></i>
                    </div>
                    <div>
                        <div class="dealerp-kpi-label">Expéditions</div>
                        <div class="dealerp-kpi-value" id="kpi-expeditions">—</div>
                    </div>
                </div>

                <div class="dealerp-kpi">
                    <div class="dealerp-kpi-icon">
                        <i class="fa fa-cogs"></i>
                    </div>
                    <div>
                        <div class="dealerp-kpi-label">Prestations</div>
                        <div class="dealerp-kpi-value" id="kpi-prestations">—</div>
                    </div>
                </div>

                <div class="dealerp-kpi">
                    <div class="dealerp-kpi-icon">
                        <i class="fa fa-tasks"></i>
                    </div>
                    <div>
                        <div class="dealerp-kpi-label">Tâches</div>
                        <div class="dealerp-kpi-value" id="kpi-taches">—</div>
                    </div>
                </div>

            </div>

            <div class="dealerp-financial-kpis">

                <div class="dealerp-financial-card">
                    <span>Chiffre d'affaires</span>
                    <strong id="kpi-ca">—</strong>
                    <small>FCFA</small>
                </div>

                <div class="dealerp-financial-card">
                    <span>Encaissements</span>
                    <strong id="kpi-encaissements">—</strong>
                    <small>FCFA</small>
                </div>

                <div class="dealerp-financial-card">
                    <span>Impayés</span>
                    <strong id="kpi-impayes">—</strong>
                    <small>FCFA</small>
                </div>

            </div>

            <div class="dealerp-dashboard-grid">

                <div class="dealerp-card">
                    <div class="dealerp-card-header">
                        <h4>Activité</h4>
                    </div>
                    <div class="dealerp-chart-placeholder">
                        Graphique d'activité
                    </div>
                </div>

                <div class="dealerp-card">
                    <div class="dealerp-card-header">
                        <h4>État des dossiers</h4>
                    </div>
                    <div id="dealerp-dossier-status">
                        Chargement...
                    </div>
                </div>

            </div>

            <div class="dealerp-card">
                <div class="dealerp-card-header">
                    <h4>Alertes & actions</h4>
                </div>

                <div id="dealerp-alerts">
                    Chargement...
                </div>
            </div>

        </div>
    `);

    $("#dealerp-refresh").on("click", function () {
        load_dashboard();
    });

    function load_dashboard() {
        frappe.call({
            method: "dealerp.api.dashboard.get_dashboard_data",
            callback: function (r) {
                if (!r.message) {
                    return;
                }

                const data = r.message;

                $("#kpi-dossiers").text(data.dossiers || 0);
                $("#kpi-expeditions").text(data.expeditions || 0);
                $("#kpi-prestations").text(data.prestations || 0);
                $("#kpi-taches").text(data.taches || 0);

                $("#kpi-ca").text(format_number(data.ca));
                $("#kpi-encaissements").text(format_number(data.encaissements));
                $("#kpi-impayes").text(format_number(data.impayes));
            }
        });
    }

    function format_number(value) {
        return new Intl.NumberFormat("fr-FR").format(value || 0);
    }

    load_dashboard();
};
